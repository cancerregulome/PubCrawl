package org.systemsbiology.cancerregulome;

import org.apache.commons.cli.*;
import org.apache.commons.lang.StringUtils;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.logging.Logger;

import static java.lang.System.currentTimeMillis;
import static org.apache.commons.lang.StringUtils.isEmpty;
import static org.apache.commons.lang.StringUtils.replace;
import static org.systemsbiology.cancerregulome.DbUtils.getJdbcTemplate;
import static org.systemsbiology.cancerregulome.DbUtils.getSolrServer;


/**
 * @author aeakin
 * Used to determine single counts of terms within the medline solr instance
 */
public class SingleCountCrawl {
    private static final Logger log = Logger.getLogger(SingleCountCrawl.class.getName());

    public static class SolrCallable implements Callable {
        private String term1;
        private List<String[]> term1Array;
        private SolrServer server;
        private boolean useAlias;
        private Map<String, String> filterGrayList;  //items in this list represent items where if the values occur with the key then remove those from the search
        private Map<String, String> keepGrayList;    //only keep the keys if the values occur with them

        public SolrCallable(SearchTermAndList stal, SolrServer server, boolean useAlias,
                            Map<String, String> filterGrayList, Map<String, String> keepGrayList) {
            this.term1 = stal.getTerm();
            this.server = server;
            this.term1Array = stal.asListArray();
            this.useAlias = useAlias;
            this.filterGrayList = filterGrayList;
            this.keepGrayList = keepGrayList;

        }

        public SingleCountItem call() {
            SingleCountItem totalResults = null;
            SolrQuery query = new SolrQuery();
            query.setQuery("*:*");
            query.set("qt", "distributed_select");
            query.addFilterQuery("+pub_date_year:[1990 TO 2012]");
            query.setParam("fl", "pmid");

            for(int i=0; i< term1Array.size(); i++){
            String term1Combined = "";
            for (String aTerm1Array : term1Array.get(i)) {
                if (filterGrayList.containsKey(aTerm1Array.toLowerCase())) {
                    String filterTerms = filterGrayList.get(aTerm1Array.toLowerCase());
                    String[] splitFilterTerms = filterTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + aTerm1Array + "\" -(";
                    for (String splitFilterTerm : splitFilterTerms) {
                        term1Combined = term1Combined + "\"" + splitFilterTerm + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else if (keepGrayList.containsKey(aTerm1Array.toLowerCase())) {
                    String keepTerms = keepGrayList.get(aTerm1Array.toLowerCase());
                    String[] splitKeepTerms = keepTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + aTerm1Array + "\" +(";
                    for (String splitKeepTerm : splitKeepTerms) {
                        term1Combined = term1Combined + "\"" + splitKeepTerm + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else {
                    term1Combined = term1Combined + "\"" + aTerm1Array + "\" ";
                }
            }
                   query.addFilterQuery("+text:(" + term1Combined + ")");
            }

            try {
                QueryResponse rsp = this.server.query(query);
                totalResults = new SingleCountItem(rsp.getResults().getNumFound(), this.term1, this.term1Array, useAlias);
            } catch (SolrServerException e) {
                log.warning(e.getMessage());
                System.exit(1);
            }
            return totalResults;
        }
    }

    public static class SingleCountItem {
        private long term1count;
        private String term1;
        private List<String[]> term1Array;
        private boolean useAlias;

        public SingleCountItem(long term1count, String term1, List<String[]> term1Array, boolean useAlias) {
            this.term1count = term1count;
            this.term1 = term1;
            this.term1Array = term1Array;
            this.useAlias = useAlias;

        }

        public String printItem() {
            if (this.useAlias) {
                if(term1Array.size() == 1)
                    return this.term1 + "\t" + StringUtils.join(this.term1Array.get(0), ",") + "\t" + this.term1count + "\n";
                else
                   return this.term1 + "\t" + this.term1 + "\t" + this.term1count + "\n";
            } else {
                return this.term1 + "\t" + this.term1count + "\n";
            }
        }
    }

    public static void main(String[] args) throws Exception {
        String inputFileName = "";
        String outputFileName = "";
        String keepListFileName = "";
        String filterListFileName = "";
        String solrServerHost = "";
        String searchTerm = "";
        Map<String, String> keepGrayList = new HashMap<String, String>();
        Map<String, String> filterGrayList = new HashMap<String, String>();
        boolean useAlias = false;

        log.info("about to parse CLI");
        CommandLineParser parser = new GnuParser();
        Options options = createCLIOptions();
        try {
            CommandLine line = parser.parse(options, args);

            if (line.hasOption("f")) {
                //get the input file
                inputFileName = line.getOptionValue("f");
            }
            if (line.hasOption("o")) {
                //get the output file
                outputFileName = line.getOptionValue("o");
            }
            if (line.hasOption("s")) {
                //get the server host name
                solrServerHost = line.getOptionValue("s");
            }
            if (line.hasOption("a")) {
                useAlias = true;
            }
            if (line.hasOption("term")) {
                searchTerm = line.getOptionValue("term");
            }
            if (line.hasOption("k")) {
                keepListFileName = line.getOptionValue("k");
            }
            if (line.hasOption("r")) {
                filterListFileName = line.getOptionValue("r");
            }
        } catch (ParseException exp) {
            log.warning("Command line parsing failed.  Reason:" + exp.getMessage());
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("singlecountcrawl", options);
            System.exit(1);
        }

        log.info("done parsing");
        if (isEmpty(outputFileName)) {
            //missing required elements, print usage and exit
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("singlecountcrawl", options);
            System.exit(1);
        }

        log.info("checking input filename");
        List<String> termList = new ArrayList<String>();
        if (isEmpty(inputFileName) && isEmpty(searchTerm)) {
            //no input file entered, and no values from term option, use values from term database
            termList = getTermList();
        } else if (!isEmpty(inputFileName)) {
            FileReader inputReader = new FileReader(inputFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String fileSearchTerm = bufReader.readLine();
            while (fileSearchTerm != null) {
                termList.add(fileSearchTerm.trim());
                fileSearchTerm = bufReader.readLine();
            }

            bufReader.close();
        } else { //search term was entered
            termList.add(searchTerm.trim());
        }

        log.info("loading keeplist filename");
        if (!isEmpty(keepListFileName)) {
            //need to load the keepList hashmap
            FileReader inputReader = new FileReader(keepListFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String keepTerm = bufReader.readLine();
            while (keepTerm != null) {
                String[] keepInfoArr = keepTerm.trim().split("\t");
                keepGrayList.put(keepInfoArr[0].toLowerCase(), keepInfoArr[1]);
                keepTerm = bufReader.readLine();

            }

            bufReader.close();
        }

        log.info("loading filterlist filename");
        if (!isEmpty(filterListFileName)) {
            //need to load the keepList hashmap
            FileReader inputReader = new FileReader(filterListFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String filterTerm = bufReader.readLine();
            while (filterTerm != null) {
                String[] filterInfoArr = filterTerm.trim().split("\t");
                filterGrayList.put(filterInfoArr[0].toLowerCase(), filterInfoArr[1]);
                filterTerm = bufReader.readLine();

            }

            bufReader.close();
        }

        SolrServer[] servers = getSolrServer(solrServerHost);
        String logname = outputFileName + "_log.out";
        //create output files
        FileWriter logFileStream = new FileWriter(logname);
        BufferedWriter logFileOut = new BufferedWriter(logFileStream);
        FileWriter dataResultsStream = new FileWriter(outputFileName);
        BufferedWriter dataResultsOut = new BufferedWriter(dataResultsStream);

        Set<Future<SingleCountItem>> set = new HashSet<Future<SingleCountItem>>();

        ExecutorService pool = Executors.newFixedThreadPool(32);
        log.info("created threadpool");
        long firstTime = currentTimeMillis();
        int serverNum=0;
        for (String aTermList : termList) {
            SearchTermAndList searchTermArray = getTermAndTermList(aTermList, useAlias);
            Callable<SingleCountItem> callable = new SolrCallable(searchTermArray, servers[serverNum], useAlias, filterGrayList, keepGrayList);
            Future<SingleCountItem> future = pool.submit(callable);
            set.add(future);
            serverNum++;
            if(serverNum >= servers.length){
                serverNum=0;
            }

        }

        for (Future<SingleCountItem> future : set) {
            dataResultsOut.write(future.get().printItem());
        }

        long secondTime = currentTimeMillis();
        logFileOut.write("Query took " + (secondTime - firstTime) / 1000 + " seconds.\n");


        logFileOut.flush();
        logFileOut.close();
        dataResultsOut.flush();
        dataResultsOut.close();
        pool.shutdown();
        System.exit(0);

    }

    public static List<String> getTermList() {
        final List<String> termList = new ArrayList<String>();
        //now read in config for database

        try {
            JdbcTemplate jdbcTemplate = getJdbcTemplate();

            String sql = "Select m.term_id,m.term_value,a.value from term_mapping m, term_aliases a where m.exclude=0 and a.exclude=0 and m.term_id=a.alias_id order by term_id";
            jdbcTemplate.query(sql, new ResultSetExtractor() {
                @Override
                public Object extractData(ResultSet rs) throws SQLException, DataAccessException {
                    int termId = -1;
                    String termConcatList = null;

                    while (rs.next()) {
                        int newtermId = rs.getInt(1);
                        String termName = rs.getString(2).trim();
                        String aliasName = rs.getString(3).trim();

                        if (newtermId != termId) {
                            //starting new term to concatenate, put old one in the list
                            if (termConcatList != null) {
                                termList.add(termConcatList);
                            }

                            termId = newtermId;
                            termConcatList = termName.trim().toLowerCase();
                        }

                        if (!aliasName.trim().toLowerCase().equals(termName.trim().toLowerCase())) {
                            termConcatList = termConcatList + "," + aliasName.trim().toLowerCase();
                          
                        }
                    }

                     if (!isEmpty(termConcatList)) {
                termList.add(termConcatList);
            }
                    return null;
                }
            });


        } catch (Exception ex) {
            log.warning("Error retrieving terms from database. Reason: " + ex.getMessage());
            System.exit(1);
        }

        return termList;

    }


    public static SearchTermAndList getTermAndTermList(String searchTerm, boolean useAlias) {
         SearchTermAndList terms;
        //first see if the item is an expression term or regular term
         if(searchTerm.trim().endsWith(")") && searchTerm.trim().startsWith("(")){
                //this is an expression, so need to parse string
             terms = new SearchTermAndList(searchTerm.trim());

                int startIndex=1;
                int phraseIndex=searchTerm.trim().indexOf(")");
                while(startIndex > 0 && phraseIndex > 0){
                    String[] termInfo = getTermAliasList(searchTerm.trim().substring(startIndex, phraseIndex));
                    terms.addItems(termInfo);
                    startIndex=searchTerm.trim().indexOf("(",phraseIndex) + 1;
                    phraseIndex=searchTerm.trim().indexOf(")",startIndex);
                }

         }
        else{    //regular term with possible aliases
             String[] finalItems = getTermAliasList(searchTerm);
             terms = new SearchTermAndList(finalItems[0]);

            if (useAlias) {
                terms.addItems(finalItems);
            } else {
                terms.addItems(finalItems[0]);
            }
         }
        return terms;
    }

    private static String[] getTermAliasList(String searchTerm) {
        String[] termItems = searchTerm.trim().split(",");
        String[] finalItems = new String[termItems.length];

        for (int i = 0; i < termItems.length; i++) {
            finalItems[i] = replace(termItems[i], "\"", "\\\"").trim().toLowerCase();
        }
        return finalItems;
    }

    public static Options createCLIOptions() {
        Options options = new Options();
        options.addOption("a", false, "use Aliases");
        Option solrServerName = OptionBuilder.withArgName("solrServer")
                .hasArg()
                .withDescription("Server to query.  ex: solrhost:4080/solr")
                .create("s");
        Option inputFileName = OptionBuilder.withArgName("inputFile")
                .hasArg()
                .withDescription("input filename for term values")
                .create("f");
        Option outputFileName = OptionBuilder.withArgName("outputFile")
                .hasArg()
                .withDescription("output filename")
                .create("o");
        Option searchTermName = OptionBuilder.withArgName("searchTerm")
                .hasArg()
                .withDescription("term to do a search with")
                .create("term");
        Option keepListName = OptionBuilder.withArgName("keepGrayList")
                .hasArg()
                .withDescription("gray list with 'keep' terms")
                .create("k");
        Option filterListName = OptionBuilder.withArgName("filterGrayList")
                .hasArg()
                .withDescription("gray list with 'filter' terms")
                .create("r");

        options.addOption(solrServerName);
        options.addOption(inputFileName);
        options.addOption(outputFileName);
        options.addOption(searchTermName);
        options.addOption(keepListName);
        options.addOption(filterListName);

        return options;
    }
}
