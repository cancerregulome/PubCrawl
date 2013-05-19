#expects a file with gene names and aliases in current directory called "terms_aliases.txt".
#and a termExcludeList file including names of terms that should be excluded.
#Also expects a pubcrawl.properties file to connect to MySQL database instance.

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
db_port=config.get('database','db_port');

geneNameFile = open("terms_aliases.txt","r");
geneList = []
excludeListFile = open("termExcludeList.txt","r");
excludeList=[]

for line in excludeListFile:
	excludeList.append(line.strip().lower());
excludeListFile.close();

countsdb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name,port=int(db_port))

counts_cur = countsdb.cursor();

i=1;                                                      
exclude=0;
for line in geneNameFile:
    if(line.startswith("#")):
        continue;
    linesplit = line.strip().split("\t");
    if(linesplit[0].endswith("~withdrawn")): #ignore this one
		continue;

    termvalue = linesplit[0].strip().lower();
    if(termvalue in excludeList):
		exclude=1;
    else:
		exclude=0;
    counts_cur.execute("INSERT INTO term_mapping(term_id,term_value, exclude) VALUES ("+str(i)+",\""+termvalue+"\"," + str(exclude) + ")");
    counts_cur.execute("INSERT INTO term_aliases (alias_id, value, exclude) VALUES ("+str(i)+",\""+termvalue+"\"," + str(exclude) + ")");

    if(len(linesplit) >= 2):
		if(linesplit[1].strip() != ""):
			aliasValues=linesplit[1].split(",");
			if(len(linesplit) >= 3):
			    if(linesplit[2].strip() != ""):
			        aliasValues=aliasValues+linesplit[2].split(",");
			insertedValues=[linesplit[0].strip().lower()];
			for alias in aliasValues:
				termvalue=alias.strip().lower();
				if(termvalue in insertedValues):
					continue;
				else:
					if(termvalue in excludeList):
						exclude=1;
					else:
						exclude=0;
					counts_cur.execute("INSERT INTO term_aliases (alias_id, value,exclude) VALUES ("+str(i)+",\""+termvalue+"\"," + str(exclude)+")");
					insertedValues.append(termvalue);
    i=i+1;
geneNameFile.close();
counts_cur.close();
			
