#retrieves drugs and puts into neo4j node format
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getDrugNodeInfo.py -o fileName";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
	print "Incorrect Arguments."
	usage();

if __name__ == "__main__":
	try:
		optlist, args=getopt.getopt(sys.argv[1:],'o:')
	except:
		usage_error();
		exit(1);

	fileString="";
	for option in optlist:
		if(option[0] == '-o'):
			fileString = option[1];

	config=ConfigParser.ConfigParser()
	config.readfp(open('pubcrawl.properties'))

	db_name= config.get('database','db_name');
	db_user= config.get('database','db_user');
	db_host=config.get('database','db_host');
	db_password=config.get('database','db_password');

	db = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

	cur = db.cursor();

	cur.execute("select term1, count from singletermcount_drug");

    #open files for writing
	outFile=open(fileString+".txt","w");
	outFile.writelines("name\ttermcount\n")

	while(1):
		data=cur.fetchone();
		if data == None:
			break;

		outFile.writelines(data[0].lower()+ "\t" + str(data[1]) + "\n");

	cur.close();
	outFile.close();
