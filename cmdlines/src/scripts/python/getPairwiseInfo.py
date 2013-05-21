#creates output of pairwise edge values to be used in neo4j
#Only outputs features that have a matching gene or alias value in the pubcrawl mysql database
#Assumes pairwise shows only one direction of relationship, output makes 2 edges - one for each direction
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getPairwiseInfo.py -i inputFile -o fileName";
    print "-i <inputFile> filename that contains input pairwise association data";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
    print "Incorrect Arguments."
    usage();

def getGene(geneMap,term):
	if(term in geneMap):
		return geneMap[term];
	else:
		return;
			
def getNode(cur,featureid):
	featureInfo=featureid.split(":");
	
	if(featureInfo[1].lower()=="gnab"):
		index=featureInfo[2].rpartition("_");
		if(index[0]==""):
			return getGene(geneMap,index[2].lower());
		else:
			return getGene(geneMap,index[0].lower());
	else:
		return getGene(geneMap,featureInfo[2].lower());

def processLine(geneMap,line,outFile):
	pwInfo=line.strip().split("\t");
	sourceNode=getNode(geneMap,pwInfo[0]);
	targetNode=getNode(geneMap,pwInfo[1]);

	if(sourceNode==None or targetNode==None or sourceNode=="" or targetNode==""):
		return;

	if(pwInfo[4]=="-inf"):
		pvalue="-1000";
	else:
		pvalue=pwInfo[4];
	
	outFile.writelines(sourceNode + "\t" + targetNode + "\t" + pwInfo[0] + "\t" + pwInfo[1] + "\t" +  pvalue +  "\t" + pwInfo[2] + "\t" + pwInfo[3] +  "\n");
	outFile.writelines(targetNode + "\t" + sourceNode + "\t" + pwInfo[1] + "\t" + pwInfo[0] + "\t" +  pvalue +  "\t" + pwInfo[2] + "\t" + pwInfo[3] +  "\n");
	return;




if __name__ == "__main__":
	try:
		optlist, args=getopt.getopt(sys.argv[1:],'i:o:')
	except:
		usage_error();
		exit(1);

	fileString="";
	inputFileString="";
	for option in optlist:
		if(option[0] == '-o'):
			fileString = option[1];
		if(option[0] == '-i'):
			inputFileString = option[1];

	if(fileString=="" or inputFileString==""):
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
	cur.execute("Select value,term_value from term_mapping,term_aliases where term_id=alias_id and term_mapping.exclude=0");
	while(1):
		data=cur.fetchone();
		if data == None:
			break;
		else:
			geneMap[data[0].lower()]=data[1].lower();
	cur.close();
   
	inputFile=open(inputFileString,"r"); 
	outFile=open(fileString,"w");
	outFile.writelines("source\ttarget\tfeatureid1\tfeatureid2\tpvalue\tcorrelation\tcount\n");
	for line in inputFile:
		processLine(geneMap,line,outFile);	

	inputFile.close();
	outFile.close();
