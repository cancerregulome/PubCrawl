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
    print "python insertSingleTermCounts.py [-a][-d] -f singleTermCountFile";
    print "-a   term count file includes aliases";
    print "-d   this is a denovo search";
    print "-f <singleTermCountFile> input file containing terms and counts";

def usage_error():
    print "Incorrect Arguments."
    usage();

if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'adf:')
    except:
        usage_error();
        exit(1);

    useAlias=False;
    deNovo=False;
    termCountFileString="";
    for option in optlist:
        if(option[0] == '-f'):
            termCountFileString = option[1];
        if(option[0] == '-a'):
            useAlias=True;
        if(option[0] == '-d'):
            deNovo=True;

    if(termCountFileString == ""):
        usage_error();
        exit(1);

    termCountFile = open(termCountFileString,"r");

    db = MySQLdb.connect(host=db_host,port=int(db_port),user=db_user,passwd=db_password,db=db_name);
    cursor = db.cursor();

    for line in termCountFile:
        linearr=line.strip().split("\t");
        if(useAlias):
            if(deNovo):
                cursor.execute("INSERT INTO singletermcount_denovo_alias (term1,alias,count) values(\"" + linearr[0] + "\",\""+ linearr[1] +"\"," + str(linearr[2]) +")");
            else:
                cursor.execute("INSERT INTO singletermcount_alias (term1,alias,count) values(\"" + linearr[0] + "\",\""+ linearr[1] +"\"," + str(linearr[2]) +")");
        else:
            if(deNovo):
                cursor.execute("INSERT INTO singletermcount_denovo (term1,count) values(\"" + linearr[0] + "\"," + str(linearr[1]) +")");
            else:
                cursor.execute("INSERT INTO singletermcount (term1,count) values(\"" + linearr[0] + "\"," + str(linearr[1]) +")");


    db.close();
    termCountFile.close();
