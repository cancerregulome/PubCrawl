#creates output of protein domain information from the domine database
#requires a domine connection count file, and a domine interaction file.
#Files are expected to be named "domain_connections_domine_hc.txt","domain_connections_domine_pdb.txt" and
#"domain_counts_high_confidence_and_pdb.txt"
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getDomineEdgeInfo.py";

def usage_error():
    print "Incorrect Arguments."
    usage();

def getGene(geneMap,term):
	if(term in geneMap):
		return geneMap[term];
	else:
		return;
			

def processLine(geneMap,dcMap,line,outFile,relType):
	dInfo=line.strip().lower().split(" ");
	sourceNode=getGene(geneMap,dInfo[0]);
	targetNode=getGene(geneMap,dInfo[5]);

	if(sourceNode==None or targetNode==None or sourceNode=="" or targetNode==""):
		return;
	
	outFile.writelines(sourceNode + "\t" + targetNode + "\t" + dInfo[1] + "\t" + dInfo[2] + "\t" +  dInfo[3] +  "\t" + dInfo[4] + "\t" + dcMap[dInfo[2]] + "\t" + dcMap[dInfo[3]] + "\t" + relType + "\n");
	outFile.writelines(targetNode + "\t" + sourceNode + "\t" + dInfo[4] + "\t" + dInfo[3] + "\t" +  dInfo[2] +  "\t" + dInfo[1] + "\t" + dcMap[dInfo[3]] + "\t" + dcMap[dInfo[2]] + "\t" + relType + "\n");
	return;




if __name__ == "__main__":
	
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
	
	dCountsFile=open("domain_counts_high_confidence_and_pdb.txt","r");
	dcMap={};
	#get counts for each domain, can then use the map later when processing the relationship files
	for line in dCountsFile:
		linearr=line.strip().lower().split(" ");
		dcMap[linearr[1].strip()]=linearr[0];
	dCountsFile.close();
	
	relFile=open("domain_connections_domine_hc.txt","r"); 
	outFile=open("domineEdgeInfo.txt","w");
	outFile.writelines("source\ttarget\tuni1\tpf1\tuni2\tpf2\tpf1_count\tpf2_count\tconn_type\n");
	for line in relFile:
		processLine(geneMap,dcMap,line,outFile,"hc");

	relFile.close();
	
	relFile2=open("domain_connections_domine_pdb.txt","r"); 
	for line in relFile2:
		processLine(geneMap,dcMap,line,outFile,"pdb");

	relFile2.close();

	
	outFile.close();
