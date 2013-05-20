#splits up list of genes into 9 files, takes -a option to determine what list to grab, puts files in format that pubcrawl expects, used when re-running
#NMD initial analysis across servers.
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser

def usage():
    print "python createGeneListFiles.py [-a] -o fileName";
    print "-a   term count file includes aliases";
    print "-o <fileName> prefix that should be used for output files";

def usage_error():
    print "Incorrect Arguments."
    usage();

if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'ao:')
    except:
        usage_error();
        exit(1);

    useAlias=False;
    fileString="";
    for option in optlist:
        if(option[0] == '-o'):
            fileString = option[1];
        if(option[0] == '-a'):
            useAlias=True;

    config=ConfigParser.ConfigParser()
    config.readfp(open('pubcrawl.properties'))

    db_name= config.get('database','db_name');
    db_user= config.get('database','db_user');
    db_host=config.get('database','db_host');
    db_password=config.get('database','db_password');

    db = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

    cur = db.cursor();



    if(useAlias):
        cur.execute("SELECT alias from singletermcount_alias where count > 0");
    else:
        cur.execute("Select term1 from singletermcount where count > 0");

    #open files for writing
    file1=open(fileString+"1.txt","w");
    file2=open(fileString+"2.txt","w");
    file3=open(fileString+"3.txt","w");
    file4=open(fileString+"4.txt","w");
    file5=open(fileString+"5.txt","w");
    file6=open(fileString+"6.txt","w");
    file7=open(fileString+"7.txt","w");
    file8=open(fileString+"8.txt","w");
    file9=open(fileString+"9.txt","w");
    outFile=file1;
    count=1;
    while(1):
        data=cur.fetchone();
        if data == None:
            break;
        outFile.writelines(data[0].lower() + "\n");
        if(count==1):
            outFile=file1;
            count=count+1;
        elif(count==2):
            outFile=file2;
            count=count+1;
        elif(count==3):
            outFile=file3;
            count=count+1;
        elif(count==4):
            outFile=file4;
            count=count+1;
        elif(count==5):
            outFile=file5;
            count=count+1;
        elif(count==6):
            outFile=file6;
            count=count+1;
        elif(count==7):
            outFile=file7;
            count=count+1;
        elif(count==8):
            outFile=file8;
            count=count+1;
        elif(count==9):
            outFile=file9;
            count=1;

    cur.close();
    file1.close();
    file2.close();
    file3.close();
    file4.close();
    file5.close();
    file6.close();
    file7.close();
    file8.close();
    file9.close();
         


