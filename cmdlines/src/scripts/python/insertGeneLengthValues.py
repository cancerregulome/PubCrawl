#update the geneLength column in the term_mappings to specify the length of a gene
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

geneLengthFile = open("geneLengths.txt","r");

pubcrawldb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

cur = pubcrawldb.cursor();

for line in geneLengthFile:
	linesplit = line.strip().split("\t");
	cur.execute("UPDATE term_mapping SET geneLength=" + linesplit[1].lower() + " WHERE term_value='"+linesplit[0].lower()+"'");
geneLengthFile.close();


cur.close();
			
