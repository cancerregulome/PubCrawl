package org.systemsbiology.cancerregulome;

import org.apache.commons.dbcp.BasicDataSource;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.impl.CommonsHttpSolrServer;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Properties;
import java.util.logging.Logger;

import static org.apache.commons.lang.StringUtils.isEmpty;

/**
 * @author hrovira
 */
public class DbUtils {
    private static final Logger log = Logger.getLogger(DbUtils.class.getName());

    public static JdbcTemplate getJdbcTemplate() {
        try {
            Resource r = new FileSystemResource("pubcrawl.properties");
            Properties prop = new Properties();
            prop.load(r.getInputStream());

            String jdbc_driver = prop.getProperty("jdbc_driver");
            String jdbc_url = prop.getProperty("jdbc_url");

            BasicDataSource bds = new BasicDataSource();
            if (isEmpty(jdbc_driver) && isEmpty(jdbc_url)) {
                String dbname = prop.getProperty("db_name");
                String dbport = prop.getProperty("db_port");
                String dbhost = prop.getProperty("db_host");

                bds.setDriverClassName("com.mysql.jdbc.Driver");
                bds.setUrl("jdbc:mysql://" + dbhost + ":" + dbport + "/" + dbname);
            } else {
                bds.setDriverClassName(jdbc_driver);
                bds.setUrl(jdbc_url);
            }

            bds.setUsername(prop.getProperty("db_user"));
            bds.setPassword(prop.getProperty("db_password"));

            return new JdbcTemplate(bds);
        } catch (Exception ex) {
            log.warning(ex.getMessage());
            System.exit(1);
        }
        return null;
    }

    public static SolrServer[] getSolrServer(String solrServerHost) {
        try {
            if (isEmpty(solrServerHost)) {
                Resource r = new FileSystemResource("pubcrawl.properties");
                Properties prop = new Properties();
                prop.load(r.getInputStream());
                solrServerHost = prop.getProperty("solr_server");
            }
            String[] servers = solrServerHost.split(",");
            SolrServer[] serverArray = new SolrServer[servers.length];
            for(int i =0; i<servers.length; i++){
                System.out.println("servers: " + servers[i] );
                SolrServer s =  new CommonsHttpSolrServer("http://" + servers[i]);
                serverArray[i]=s;
            }
            return serverArray;
        } catch (Exception ex) {
            log.warning(ex.getMessage());
            System.exit(1);
        }
        return null;
    }
}
