#expects a file with exclusion terms, used to update exclusion terms if needed
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

excludeListFile = open("termExcludeList.txt","r");
excludeList=[]

countsdb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

counts_cur = countsdb.cursor();


for line in excludeListFile:
	counts_cur.execute("UPDATE term_mapping set exclude=1 where term_value='"+line.strip().lower()+"'");
	counts_cur.execute("UPDATE term_aliases set exclude=1 where value='"+line.strip().lower()+"'");
excludeListFile.close();


counts_cur.close();

