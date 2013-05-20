#update the tf column in the term_mappings to specify whether a gene is a transcription factor
__author__ = 'aeakin'
import sys
import MySQLdb
import ConfigParser

config=ConfigParser.ConfigParser()
config.readfp(open('pubcrawl.properties'))

db_name= config.get('database','db_name');
db_user= config.get('database','db_user');
db_host=config.get('database','db_host');
db_password=config.get('database','db_password');

tfFile = open("tfGenes.txt","r");

pubcrawldb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

cur = pubcrawldb.cursor();

for line in tfFile:
	linesplit = line.strip().split(" ");
	cur.execute("UPDATE term_mapping SET tf='1' WHERE term_value='"+linesplit[0].lower()+"'");
tfFile.close();


cur.close();
			
