#creates output of nmd values
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getNMDValues.py [-a] -i inputFile -o fileName";
    print "-a    file includes aliases";
    print "-i <inputFile> file containing nmd values";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
    print "Incorrect Arguments."
    usage();

if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'o:i:a')
    except:
        usage_error();
        exit(1);

    useAlias=False;
    fileString="";
    inputFileString="";
    for option in optlist:
        if(option[0] == '-o'):
            fileString = option[1];
        if(option[0] == '-a'):
            useAlias=True;
        if(option[0] == '-i'):
	    inputFileString = option[1];

    if(fileString=="" or inputFileString==""):
        usage_error();
        exit(1);

    outFile = open(fileString,"w");
    outFile.writelines("source\ttarget\tnmd\tcombocount\n");

    inputFile = open(inputFileString, "r");

    for line in inputFile:
	linearr=line.strip().split("\t");
	if(linearr[1] == linearr[0]):
		continue; #don't want to load self-edges
    	if(useAlias):
        	if(linearr[7] == "-1.0"):
			continue;
		else:
			outFile.writelines(linearr[0].lower() + "\t" + linearr[2].lower() + "\t" + linearr[7] + "\t" + linearr[6] + "\n");	
    	else:
        	if(linearr[5] == "-1.0"):
			continue;
		else:
			outFile.writelines(linearr[0].lower() + "\t" + linearr[1].lower() + "\t" + linearr[5] + "\t" + linearr[4] + "\n");	

    outFile.close();
    inputFile.close();

