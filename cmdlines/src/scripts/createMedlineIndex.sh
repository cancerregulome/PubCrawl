#!/bin/bash
#author - aeakin
#Iterates over a directory of MEDLINE .gz files, parses them into solr xml, and posts to solr
#First argument is the directory location of the MEDLINE files, Second argument is the Solr server address

find $1/medline13n*.gz | sort | while read -r F
do
        echo "processing " $F
        xmlName=${F%.gz}

        gzip -d  $F

        echo "unzipped " $F
        echo "creating solr xml for " $xmlName

        /tools/bin/python2.7 parseMedlineXML.py $xmlName $xmlName.solr.xml

        gzip  $xmlName

        echo "posting to Solr "
        curl -X POST -d @$xmlName.solr.xml -H "Content-Type: text/xml"  http://$2/update?commit=true

    rm $xmlName.solr.xml

done

