package org.systemsbiology.cancerregulome;

import org.apache.commons.cli.*;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrRequest;
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
import static org.apache.commons.lang.StringUtils.*;
import static org.systemsbiology.cancerregulome.DbUtils.getJdbcTemplate;
import static org.systemsbiology.cancerregulome.DbUtils.getSolrServer;


/**
 * @author aeakin
 * Used to determine distances between pairs in the medline solr instance.  Used for initial
 * NMD distance calculations, DeNovo search, and ad-hoc script for researchers to do queries between
 * two lists of terms on their own (doesn't have to be drugs).
 */
public class Pubcrawl {
    private static final Logger log = Logger.getLogger(Pubcrawl.class.getName());

    public class SolrCallable implements Callable {
        private String term1;
        private String term2;
        private long term1count;
        private long term2count;
        private long totalDocCount;
        private List<String[]> term1Array;
        private List<String[]> term2Array;
        private SolrServer server;
        private boolean useAlias;
        private Map<String, String> filterGrayList;  //items in this list represent items where if the values occur with the key then remove those from the search
        private Map<String, String> keepGrayList;    //only keep the keys if the values occur with them

        public SolrCallable(SearchTermAndList stal1, SearchTermAndList stal2, long term1count, long term2count, SolrServer server, boolean useAlias,
                            HashMap<String, String> filterGrayList, HashMap<String, String> keepGrayList, long totalDocCount) {
            this.term1 = stal1.getTerm();
            this.term2 = stal2.getTerm();
            this.term1count = term1count;
            this.term2count = term2count;
            this.server = server;
            this.term1Array = stal1.asListArray();
            this.term2Array = stal2.asListArray();
            this.useAlias = useAlias;
            this.filterGrayList = filterGrayList;
            this.keepGrayList = keepGrayList;
            this.totalDocCount=totalDocCount;
        }

        public NGDItem call() {
            NGDItem totalResults = null;
            SolrQuery query = new SolrQuery();

            query.setQuery("+text:(*:*)");
            query.set("qt", "distributed_select");
            query.addFilterQuery("+pub_date_year:[1990 TO 2012]");
            query.setParam("fl", "pmid");

            for(int i=0; i< term1Array.size(); i++){
                String term1Combined = createCombinedTerm(term1Array.get(i));
                query.addFilterQuery("+text:(" + term1Combined + ")");
            }
            for(int j=0; j< term2Array.size(); j++){
                String term2Combined = createCombinedTerm(term2Array.get(j));
                query.addFilterQuery("+text:(" + term2Combined + ")");
            }

            boolean retry = false;
            try {

                QueryResponse rsp = this.server.query(query);
                totalResults = new NGDItem(this.term1count, this.term2count, this.term1, this.term2, this.term1Array, this.term2Array, rsp.getResults().getNumFound(), useAlias, this.totalDocCount);
            } catch (SolrServerException e) {
                log.warning(e.getMessage());
                e.printStackTrace();
                retry=true;
            }

            if(retry){
                log.warning("retrying query");
                try {
                        //retry once.....
                    QueryResponse rsp = this.server.query(query);
                    totalResults = new NGDItem(this.term1count, this.term2count, this.term1, this.term2, this.term1Array, this.term2Array, rsp.getResults().getNumFound(), useAlias, this.totalDocCount);
                } catch (SolrServerException e) {
                    log.warning(e.getMessage());
                    e.printStackTrace();
                    System.exit(1);
                }

            }
            return totalResults;
        }

        public String createCombinedTerm(String[] termArray) {
            String term1Combined = "";

            for (String aTermArray : termArray) {
                if (filterGrayList.containsKey(aTermArray.toLowerCase())) {
                    String filterTerms = filterGrayList.get(aTermArray.toLowerCase());
                    String[] splitFilterTerms = filterTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + aTermArray + "\" -(";
                    for (String splitFilterTerm : splitFilterTerms) {
                        term1Combined = term1Combined + "\"" + splitFilterTerm + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else if (keepGrayList.containsKey(aTermArray.toLowerCase())) {
                    String keepTerms = keepGrayList.get(aTermArray.toLowerCase());
                    String[] splitKeepTerms = keepTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + aTermArray + "\" +(";
                    for (String splitKeepTerm : splitKeepTerms) {
                        term1Combined = term1Combined + "\"" + splitKeepTerm + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else {
                    term1Combined = term1Combined + "\"" + aTermArray + "\" ";
                }
            }

            return term1Combined;
        }
    }

    public  class NGDItem {
        private double ngd;
        private long term1count;
        private long term2count;
        private String term1;
        private String term2;
        private long combocount;
        private List<String[]> term1Array;
        private List<String[]> term2Array;
        private boolean useAlias;
        private long totalDocCount;

        public NGDItem(long term1count, long term2count, String term1, String term2, List<String[]> term1Array, List<String[]> term2Array, long combocount, boolean useAlias, long totalDocCount) {
            this.term1count = term1count;
            this.term2count = term2count;
            this.term1 = term1;
            this.term2 = term2;
            this.combocount = combocount;
            this.term1Array = term1Array;
            this.term2Array = term2Array;
            this.useAlias = useAlias;
            this.totalDocCount=totalDocCount;

            if (this.combocount == 0) {
                this.ngd = -1;
            } else {
                double term1_log = Math.log10(this.term1count);
                double term2_log = Math.log10(this.term2count);
                double combo_log = Math.log10(this.combocount);

                this.ngd = (Math.max(term1_log, term2_log) - combo_log) / (Math.log10(this.totalDocCount) - Math.min(term1_log, term2_log));
            }

        }

        public String printItem() {
            if (this.useAlias) {
                String term1Alias = term1Array.size() == 1 ? join(this.term1Array.get(0), ",") : this.term1;
                String term2Alias = term2Array.size() == 1 ? join(this.term2Array.get(0), ",") : this.term2;
                return this.term1 + "\t" + term1Alias + "\t" + this.term2 + "\t" + term2Alias + "\t" + this.term1count + "\t" + this.term2count + "\t" + this.combocount + "\t" + this.ngd + "\n";
            } else {
                return this.term1 + "\t" + this.term2 + "\t" + this.term1count + "\t" + this.term2count + "\t" + this.combocount + "\t" + this.ngd + "\n";
            }
        }
    }

    public static void main(String[] args) throws Exception {
        String inputFileName = "";
        String inputFileName2 = "";
        String outputFileName = "";
        String solrServerHost = "";
        String keepListFileName = "";
        String filterListFileName = "";
        String searchTerm = "";
        HashMap<String, String> keepGrayList = new HashMap<String, String>();
        HashMap<String, String> filterGrayList = new HashMap<String, String>();
        boolean useAlias = false;

        CommandLineParser parser = new GnuParser();
        Options options = createCLIOptions();
        try {
            CommandLine line = parser.parse(options, args);

            if (line.hasOption("f1")) {
                //get the input file
                inputFileName = line.getOptionValue("f1");
            }
            if (line.hasOption("f2")) {
                inputFileName2 = line.getOptionValue("f2");
            }
            if (line.hasOption("o")) {
                //get the output file
                outputFileName = line.getOptionValue("o");
            }
            if (line.hasOption("s")) {
                //get the server host name
                solrServerHost = line.getOptionValue("s");
            }
            if (line.hasOption("term")) {
                searchTerm = line.getOptionValue("term");
            }
            if (line.hasOption("a")) {
                useAlias = true;
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
            formatter.printHelp("pubcrawl", options);
            System.exit(1);
        }

        if (isEmpty(outputFileName) || isEmpty(inputFileName) && isEmpty(searchTerm)) {
            //missing required elements, print usage and exit
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("pubcrawl", options);
            System.exit(1);
        }

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
            //need to load the filterlist hashmap
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

        final Map<String, Integer> singleCountMap = new HashMap<String, Integer>();
        final List<String> term2List = new ArrayList<String>();

        //now load the appropriate list of gene terms  - if the second file name wasn't entered
        if (isEmpty(inputFileName2)) {
            String sql = "Select term1,count from singletermcount";
            if (useAlias) {
                sql = "Select alias,count from singletermcount_alias";
            }

            JdbcTemplate jdbcTemplate = getJdbcTemplate();
            jdbcTemplate.query(sql, new ResultSetExtractor() {
                public Object extractData(ResultSet rs) throws SQLException, DataAccessException {
                    while (rs.next()) {
                        String geneName = rs.getString(1).trim();
                        int count = rs.getInt(2);
                        singleCountMap.put(geneName.toLowerCase(), count);
                        if (count > 0) {
                            term2List.add(geneName.toLowerCase());
                        }
                    }
                    return null;
                }
            });
        } else { //have a second input file, so read the file in and put those as the terms in the term2List, set the SingleCountMap to empty
            FileReader inputReader2 = new FileReader(inputFileName2);
            BufferedReader bufReader2 = new BufferedReader(inputReader2);
            String searchTerm2 = bufReader2.readLine();
            while (searchTerm2 != null) {
                term2List.add(searchTerm2.trim().toLowerCase());
                searchTerm2 = bufReader2.readLine();
            }
        }

        Long totalDocCount = getTotalDocCount(servers[0]);
        logFileOut.write("Total doc count: " + totalDocCount);
        Pubcrawl p = new Pubcrawl();
        if (isEmpty(inputFileName)) { //entered term option, just have one to calculate
            SearchTermAndList searchTermArray = getTermAndTermList(searchTerm.trim(), useAlias, false);
            Long searchTermCount = getTermCount(servers[0], singleCountMap, searchTermArray, filterGrayList, keepGrayList);

            ExecutorService pool = Executors.newFixedThreadPool(32);
            Set<Future<NGDItem>> set = new HashSet<Future<NGDItem>>();
            Date firstTime = new Date();
            int serverNum=0;
            for (String secondTerm : term2List) {
                SearchTermAndList secondTermArray = getTermAndTermList(secondTerm, useAlias, false);
                long secondTermCount = getTermCount(servers[serverNum], singleCountMap, secondTermArray, filterGrayList, keepGrayList);
                Callable<NGDItem> callable = p.new SolrCallable(searchTermArray, secondTermArray, searchTermCount, secondTermCount, servers[serverNum], useAlias, filterGrayList, keepGrayList,totalDocCount);
                Future<NGDItem> future = pool.submit(callable);
                set.add(future);
                serverNum++;
                if(serverNum >= servers.length){
                    serverNum=0;
                }
            }

            for (Future<NGDItem> future : set) {
                dataResultsOut.write(future.get().printItem());
            }

            Date secondTime = new Date();
            logFileOut.write("First set of queries took " + (secondTime.getTime() - firstTime.getTime()) / 1000 + " seconds.\n");
            logFileOut.flush();
            logFileOut.close();
            dataResultsOut.flush();
            dataResultsOut.close();
            pool.shutdown();

        } else {

            FileReader inputReader = new FileReader(inputFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String fileSearchTerm = bufReader.readLine();
            SearchTermAndList searchTermArray = getTermAndTermList(fileSearchTerm, useAlias, false);
            Long searchTermCount = getTermCount(servers[0], singleCountMap, searchTermArray, filterGrayList, keepGrayList);

            //do this once with a lower amount of threads, in case we are running on a server where new caching is taking place
            ExecutorService pool = Executors.newFixedThreadPool(32);
            List<Future<NGDItem>> set = new ArrayList<Future<NGDItem>>();
            long firstTime = currentTimeMillis();
            int count=0;
            int serverNum=0;
            for (String secondTerm : term2List) {
                count++;
                SearchTermAndList secondTermArray = getTermAndTermList(secondTerm, useAlias, false);
                long secondTermCount = getTermCount(servers[serverNum], singleCountMap, secondTermArray, filterGrayList, keepGrayList);
                Callable<NGDItem> callable = p.new SolrCallable(searchTermArray, secondTermArray, searchTermCount, secondTermCount, servers[serverNum], useAlias, filterGrayList, keepGrayList,totalDocCount);
                Future<NGDItem> future = pool.submit(callable);
                set.add(future);

                if(count > 5000){
                    for (Future<NGDItem> futureItem : set) {
                        dataResultsOut.write(futureItem.get().printItem());
                        futureItem = null;
                    }
                    count=0;
                    set.clear();
                }
                serverNum++;
                if(serverNum >= servers.length){
                    serverNum=0;
                }
            }

            for (Future<NGDItem> future : set) {
                dataResultsOut.write(future.get().printItem());
            }

            long secondTime = currentTimeMillis();
            logFileOut.write("First set of queries took " + (secondTime - firstTime) / 1000 + " seconds.\n");
            logFileOut.flush();
            set.clear();

            pool = Executors.newFixedThreadPool(32);
            fileSearchTerm = bufReader.readLine();
            count=0;
            while (fileSearchTerm != null) {
                searchTermArray = getTermAndTermList(fileSearchTerm, useAlias, false);
                searchTermCount = getTermCount(servers[0], singleCountMap, searchTermArray, filterGrayList, keepGrayList);
                secondTime = currentTimeMillis();
                for (String secondTerm : term2List) {
                    SearchTermAndList secondTermArray = getTermAndTermList(secondTerm, useAlias, false);
                    long secondTermCount = getTermCount(servers[serverNum], singleCountMap, secondTermArray, filterGrayList, keepGrayList);
                    Callable<NGDItem> callable = p.new SolrCallable(searchTermArray, secondTermArray, searchTermCount, secondTermCount, servers[serverNum], useAlias, filterGrayList, keepGrayList,totalDocCount);
                    Future<NGDItem> future = pool.submit(callable);
                    set.add(future);
                    count++;
                    if(count > 5000){
                        for (Future<NGDItem> futureItem : set) {
                            dataResultsOut.write(futureItem.get().printItem());
                            futureItem = null;
                        }
                        count=0;
                        set.clear();
                    }
                    serverNum++;
                if(serverNum >= servers.length){
                    serverNum=0;
                }
                }

                for (Future<NGDItem> future : set) {
                    dataResultsOut.write(future.get().printItem());
                    future=null;
                }

                logFileOut.write("Query took " + (currentTimeMillis() - secondTime) / 1000 + " seconds.\n");
                logFileOut.flush();
                set.clear();
                fileSearchTerm = bufReader.readLine();

            }

            long fourthTime = currentTimeMillis();
            logFileOut.write("Final time: " + (fourthTime - firstTime) / 1000 + " seconds.\n");
            bufReader.close();
            logFileOut.flush();
            logFileOut.close();
            dataResultsOut.flush();
            dataResultsOut.close();
            pool.shutdown();
        }
        System.exit(0);

    }

    private static long getTermCount(SolrServer server, Map<String, Integer> singleCountMap, SearchTermAndList searchTermAndList, Map<String, String> filterGrayList,
                                     Map<String, String> keepGrayList) {
        List<String[]> searchTerms = searchTermAndList.asListArray();
        Integer searchTermCountObject = searchTerms.size() != 1 ? null : singleCountMap.get(join(searchTerms.get(0), ","));
        long searchTermCount = 0;
        if (searchTermCountObject == null) {
            //didn't find it in map, so need to go get count
            SolrQuery query = new SolrQuery();
            query.setQuery("+text:(*:*)");
            query.set("qt", "distributed_select");
            query.addFilterQuery("+pub_date_year:[1990 TO 2012]");
            query.setParam("fl", "pmid");

            for(int i=0; i< searchTerms.size(); i++){
                String term1 = "";
                for (String aTermArray : searchTerms.get(i)) {
                    if (filterGrayList.containsKey(aTermArray.toLowerCase())) {
                        String filterTerms = filterGrayList.get(aTermArray.toLowerCase());
                        String[] splitFilterTerms = filterTerms.split(",");
                        term1 = term1 + "(+\"" + aTermArray + "\" -(";

                        for (String splitFilterTerm : splitFilterTerms) {
                            term1 = term1 + "\"" + splitFilterTerm + "\" ";
                        }
                        term1 = term1 + ")) ";
                    } else if (keepGrayList.containsKey(aTermArray.toLowerCase())) {
                        String keepTerms = keepGrayList.get(aTermArray.toLowerCase());
                        String[] splitKeepTerms = keepTerms.split(",");
                        term1 = term1 + "(+\"" + aTermArray + "\" +(";

                        for (String splitKeepTerm : splitKeepTerms) {
                            term1 = term1 + "\"" + splitKeepTerm + "\" ";
                        }
                        term1 = term1 + ")) ";
                    } else {
                        term1 = term1 + "\"" + aTermArray + "\" ";
                    }
                }

                query.addFilterQuery("+text:(" + term1 + ")");
            }

            try {
                QueryResponse rsp = server.query(query);
                searchTermCount = rsp.getResults().getNumFound();
                singleCountMap.put(join(searchTerms.get(0), ","), Integer.parseInt(Long.toString(searchTermCount)));
            } catch (SolrServerException e) {
                //exit out if there is an error
                log.warning(e.getMessage());
                System.exit(1);
            }
        } else {
            searchTermCount = searchTermCountObject;
        }
        return searchTermCount;
    }

    private static long getTotalDocCount(SolrServer server) {
              long totalDocCount=0;

              SolrQuery query = new SolrQuery();
              query.setQuery("+text:(*:*)");
              query.set("qt", "distributed_select");
              query.addFilterQuery("+pub_date_year:[1990 TO 2012]");
              query.setParam("fl", "pmid");

              try {
                  QueryResponse rsp = server.query(query);
                  totalDocCount = rsp.getResults().getNumFound();
              } catch (SolrServerException e) {
                  //exit out if there is an error
                  log.warning(e.getMessage());
                  System.exit(1);
              }

          return totalDocCount;
      }

    public static SearchTermAndList getTermAndTermList(String searchTerm, boolean useAlias, boolean tabDelimited) {
         SearchTermAndList terms;
        //first see if the item is an expression term or regular term
         if(searchTerm.trim().endsWith(")") && searchTerm.trim().startsWith("(")){
                //this is an expression, so need to parse string
             terms = new SearchTermAndList(searchTerm.trim());

                int startIndex=1;
                int phraseIndex=searchTerm.trim().indexOf(")");
                while(startIndex > 0 && phraseIndex > 0){
                    String[] termInfo = getTermAliasList(searchTerm.trim().substring(startIndex, phraseIndex),false);
                    terms.addItems(termInfo);
                    startIndex=searchTerm.trim().indexOf("(",phraseIndex) + 1;
                    phraseIndex=searchTerm.trim().indexOf(")",startIndex);
                }

         }
        else{    //regular term with possible aliases
             String[] finalItems = getTermAliasList(searchTerm, tabDelimited);
             terms = new SearchTermAndList(finalItems[0]);

            if (useAlias) {
                terms.addItems(finalItems);
            } else {
                terms.addItems(finalItems[0]);
            }
         }
        return terms;
    }

    private static String[] getTermAliasList(String searchTerm, boolean tabDelimited) {
        String[] termItems;
        if (tabDelimited) {
            termItems = searchTerm.trim().split("\t");
        } else {
            termItems = searchTerm.trim().split(",");
        }

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
                .withDescription("Server to query.  ex: solrhost:4080")
                .create("s");
        Option searchTermName = OptionBuilder.withArgName("termValue")
                .hasArg()
                .withDescription("search term to use as input, use either term or f1 argument")
                .create("term");
        Option inputFileName = OptionBuilder.withArgName("inputFile")
                .hasArg()
                .withDescription("input filename for term1 values")
                .create("f1");
        Option inputFileName2 = OptionBuilder.withArgName("inputFile2")
                .hasArg()
                .withDescription("input filename for term2 values")
                .create("f2");
        Option outputFileName = OptionBuilder.withArgName("outputFile")
                .hasArg()
                .withDescription("output filename")
                .create("o");
        Option keepListName = OptionBuilder.withArgName("keepGrayList")
                .hasArg()
                .withDescription("gray list with 'keep' terms")
                .create("k");
        Option filterListName = OptionBuilder.withArgName("filterGrayList")
                .hasArg()
                .withDescription("gray list with 'filter' terms")
                .create("r");
        options.addOption(solrServerName);
        options.addOption(searchTermName);
        options.addOption(inputFileName);
        options.addOption(inputFileName2);
        options.addOption(outputFileName);
        options.addOption(keepListName);
        options.addOption(filterListName);

        return options;
    }

}

