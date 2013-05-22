# =================================================================================================================
#
# Author:
#    Andrea Eakin 
#    Institute for Systems Biology, Seattle, WA
#
# Description:
#    This script is a shell that transforms the inputs (HTTP query parameters) from the Addama Script Execution Service
#       into the arguments needed for the pubcrawl  scripts.  Also inserts the values into the de novo portion of the 
#	pubcrawl database.
#
# =================================================================================================================


echo "Evaluating Inputs for Pubcrawl"
echo "- inputs:" $1

# Parsing Query String
parm=($1)
parm=${parm#"model={"}
parm=${parm%?}

saveIFS=$IFS
IFS=',:'
parm=($parm)
IFS=$saveIFS
for ((i=0; i<${#parm[@]}; i+=2))
do
  echo "- parm: ${parm[i+1]}" 
  declare var_${parm[i]}="${parm[i+1]}"
  echo "-var: var_${parm[i]}"
done

echo "Parameters"
echo "- searchTerm:[$var_searchTerm]"
echo "- useAlias:[$var_useAlias]"

if [ $var_useAlias == 'true' ]; then
    echo "Inserting into Search Term table"
    var_success=$(/tools/bin/python2.5 /titan/cancerregulome9/workspaces/pubcrawl/insertDeNovoSearch.py -a -t "$var_searchTerm")
    if [ $var_success == 'fail' ]; then
	echo "error - duplicate search"
	exit 2
    fi

    echo "Executing Single Count Crawl Script: singlecountcrawl.jar"
    /tools/java/jdk/bin/java -jar /titan/cancerregulome9/workspaces/pubcrawl/singlecountcrawl-jar-with-dependencies.jar -a -term "$var_searchTerm" -o "${var_searchTerm}".sc.out

    echo "Executing DB Insertion Script: insertSingleTermCounts.py"
    /tools/bin/python2.7 /titan/cancerregulome9/workspaces/pubcrawl/insertSingleTermCounts.py -a -d -f "${var_searchTerm}".sc.out

     echo "Executing Pubcrawl Script: pubcrawl.jar"
     /tools/java/jdk/bin/java -jar /titan/cancerregulome9/workspaces/pubcrawl/pubcrawl-jar-with-dependencies.jar -a -term "$var_searchTerm" -o "${var_searchTerm}".out
    
     echo "Executing DB Insertion Script: insertNGDItems"
     cp "${var_searchTerm}".out /local/neo4j-deNovo/deNovo.out
     /tools/bin/python2.7 /titan/cancerregulome9/workspaces/pubcrawl/insertDenovoNMD.py "${var_searchTerm}" true

else
    echo "Inserting into Search term Table"
    var_success=$(/tools/bin/python2.7 /titan/cancerregulome9/workspaces/pubcrawl/insertDeNovoSearch.py -t "$var_searchTerm")
  
    if [ $var_success == 'fail' ]; then
	echo "error - duplicate search"
	exit 2
    fi

    echo "Executing Single Count Crawl Script: singlecountcrawl.jar"
    /tools/java/jdk/bin/java -jar /titan/cancerregulome9/workspaces/pubcrawl/singlecountcrawl-jar-with-dependencies.jar -term "$var_searchTerm" -o "${var_searchTerm}".sc.out

    echo "Executing DB Insertion Script: insertSingleTermCounts.py"
    /tools/bin/python2.7 /titan/cancerregulome9/workspaces/pubcrawl/insertSingleTermCounts.py -d -f "${var_searchTerm}".sc.out

     echo "Executing Pubcrawl Script: pubcrawl.jar" 
     /tools/java/jdk/bin/java -jar /titan/cancerregulome9/workspaces/pubcrawl/pubcrawl-jar-with-dependencies.jar -term "$var_searchTerm" -o "${var_searchTerm}".out

     echo "Executing DB Insertion Script: insertDenovoNGD.py"
     cp "${var_searchTerm}".out /local/neo4j-deNovo/deNovo.out
     /tools/bin/python2.7 /titan/cancerregulome9/workspaces/pubcrawl/insertDenovoNMD.py "${var_searchTerm}" false

fi


echo "Completed"

