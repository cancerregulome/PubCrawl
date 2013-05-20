#creates output of feature matrix patient info and mutation data 
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getPatientInfo.py -i inputFile -d datasetName ";
    print "-i <inputFile> filename that contains feature matrix data with gene aberration information";
    print "-d <datasetName> name of dataset being processed";

def usage_error():
    print "Incorrect Arguments."
    usage();

def getGene(geneMap,term):
	if(term in geneMap):
		return geneMap[term];
	else:
		return;
			
def getNode(geneMap,featureid):
	featureInfo=featureid.split(":");
	
	if(len(featureInfo) > 7):
		if(featureInfo[1].lower()=="gnab" and featureInfo[7].lower()=="y_n_somatic"):
			index=featureInfo[2].rpartition("_");
			if(index[0]==""):
				return getGene(geneMap,index[2].lower());
			else:
				return getGene(geneMap,index[0].lower());

def processLine(geneMap,line,patientList,outFile):
	pwInfo=line.strip().split("\t");      
	gene=getNode(geneMap,pwInfo[0]);

	if(gene==None):
		return;

	for i in range(1,len(pwInfo)):
		if(pwInfo[i].lower()=="na" or int(pwInfo[i])==0):
			continue;
		else:
			outFile.writelines(gene + "\t" + patientList[i].lower() + "\t" + pwInfo[i].lower() + "\t" + "y_n_somatic" + "\n");
	return;

if __name__ == "__main__":
	try:
		optlist, args=getopt.getopt(sys.argv[1:],'i:d:')
	except:
		usage_error();
		exit(1);

	prefixString="";
	inputFileString="";
	for option in optlist:
		if(option[0] == '-d'):
			prefixString = option[1];
		if(option[0] == '-i'):
			inputFileString = option[1];

	if(prefixString=="" or inputFileString==""):
		usage_error();
		exit(1);
		
	config=ConfigParser.ConfigParser()
	config.readfp(open('pubcrawl.properties'))

	db_name= config.get('database','db_name');
	db_user= config.get('database','db_user');
	db_host=config.get('database','db_host');
	db_password=config.get('database','db_password');

	db = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

	cur = db.cursor();

	#get valid gene names and aliases so we can map them appropriately.  Only load genes for pubcrawl from feature matrices
	geneMap={}
	cur.execute("Select value,term_value from term_mapping,term_aliases where term_id=alias_id and term_mapping.term_exclude=0");
	while(1):
		data=cur.fetchone();
		if data == None:
			break;
		else:
			geneMap[data[0].lower()]=data[1].lower();
	cur.close();
			
	inputFile=open(inputFileString,"r"); 
	outFile=open(prefixString+"_mutationEdgeInfo.txt","w");
	outFile.writelines("source\ttarget\tvalue\tmutation_type\n");
	patientFile=open(prefixString+"_patientNodeInfo.txt","w");
	patientFile.writelines("name\n");
	first=True;
	patientList=[];
	for line in inputFile:
		if(first):
			patientList=line.strip().split("\t");
			first=False;
		else:		
			processLine(geneMap,line,patientList,outFile);
	
	inputFile.close();

	for i in range(1,len(patientList)):
		patientFile.writelines(patientList[i].lower() + "\n");
    
	patientFile.close();
	outFile.close();
