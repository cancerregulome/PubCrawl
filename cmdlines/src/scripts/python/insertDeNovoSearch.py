__author__ = 'aeakin'
import sys
import datetime
import getopt
import MySQLdb
import ConfigParser

config=ConfigParser.ConfigParser()
config.readfp(open('pubcrawl.properties'))

db_name= config.get('database','db_name');
db_user= config.get('database','db_user');
db_host=config.get('database','db_host');
db_password=config.get('database','db_password');
db_port=config.get('database','db_port');

def usage():
    print "python insertDeNovoSearch.py [-a] -t searchTerm";
    print "-a   term count file includes aliases";
    print "-t <searchTerm> comma delimited list";

def usage_error():
    print "Incorrect Arguments."
    usage();

if __name__ == "__main__":
	try:
		optlist, args=getopt.getopt(sys.argv[1:],'at:')
	except:
		usage_error();
		exit(1);

	useAlias=False;
	terms="";
	for option in optlist:
		if(option[0] == '-t'):
			terms = option[1];
		if(option[0] == '-a'):
			useAlias=True;

	if(terms == ""):
		usage_error();
		exit(1);

	db = MySQLdb.connect(host=db_host,port=int(db_port),user=db_user,passwd=db_password,db=db_name);
	cursor = db.cursor();

	termArr=terms.strip().split(",");
	if(useAlias):
		cursor.execute("Select count(*) from denovo_search_terms,singletermcount_alias where (term_value=\"" + termArr[0] + "\" and denovo_search_terms.alias=true) or (term1=\"" + termArr[0] + "\")");
		data=cursor.fetchone();
		if data == None:
			cursor.execute("INSERT INTO denovo_search_terms (term_value,term_alias, alias) values(\"" + termArr[0] + "\",\""+ (",").join(termArr[1:]) + "\",true)");
		else:
		    if(data[0] == 0):
		        cursor.execute("INSERT INTO denovo_search_terms (term_value,term_alias, alias) values(\"" + termArr[0] + "\",\""+ (",").join(termArr[1:]) + "\",true)");
		    else:
			    print "fail";
			    exit(1);
	else:
		cursor.execute("Select count(*) from denovo_search_terms,singletermcount where (term_value=\"" + termArr[0] + "\" and denovo_search_terms.alias=false) or (term1=\"" + termArr[0] + "\")");
		data=cursor.fetchone();
		if data == None:
			cursor.execute("INSERT INTO denovo_search_terms (term_value,alias) values(\"" + termArr[0] + "\",false)");
		else:
		    if(data[0] == 0):
			    cursor.execute("INSERT INTO denovo_search_terms (term_value,alias) values(\"" + termArr[0] + "\",false)");
			else:
			    print "fail";
			    exit(1);

	db.close();
