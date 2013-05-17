import sys
from xml.dom.minidom import parseString
from xml.dom.minidom import getDOMImplementation
import codecs
import xml.etree.ElementTree as ET 

#First argument should be the input medline xml file, second argument should be the output file for the solr formatted xml

file = open(sys.argv[1],'r');
tree=ET.parse(file);
file.close();

docs = []
deleteDocs=[]

impl = getDOMImplementation();
newdoc = impl.createDocument(None,"update",None);
top_element = newdoc.documentElement;
add_element = newdoc.createElement("add");
delete_element = newdoc.createElement("delete");

def handleAbstract(abstract):
	abstractStr = "";
	abstractTextList = abstract.findall('AbstractText');
	first=True;
	for abstractText in abstractTextList:
		if(abstractText.text != None):
			if(not first):
				abstractStr = abstractStr + "\n";
			abstractStr=abstractStr + abstractText.text;
			first=False;

	return abstractStr;

def createField(fieldname,fieldvalue):
	field = newdoc.createElement("field");
	field.setAttribute("name",fieldname);
	field.appendChild(newdoc.createTextNode(fieldvalue));
	return field;

xmlTag = tree.findall('MedlineCitation');
for medlineCitation in xmlTag:
	doc = newdoc.createElement("doc");
	
	pmid = medlineCitation.find('PMID');
	doc.appendChild(createField("pmid",pmid.text));

	pubdate = medlineCitation.find('Article/Journal/JournalIssue/PubDate');
	if (pubdate.find('MedlineDate') != None):
			#parse medline date here
			medlineDate = pubdate.find('MedlineDate');
			doc.appendChild(createField("pub_date_year",medlineDate.text.split(' ')[0]));
	else:
			pubdateyear = pubdate.find('Year');
			doc.appendChild(createField("pub_date_year",pubdateyear.text));
		
	
	articleTitle = medlineCitation.find('Article/ArticleTitle');
	if(articleTitle != None):
		doc.appendChild(createField("article_title",articleTitle.text));

	abstract = medlineCitation.find('Article/Abstract');
	if(abstract != None):
		doc.appendChild(createField("abstract_text",handleAbstract(abstract)));

	otherabstract = medlineCitation.find('OtherAbstract');
	if(otherabstract != None):
		doc.appendChild(createField("other_abstract",handleAbstract(otherabstract)));


	docs.append(doc);

deleteTag = tree.findall('DeleteCitation/PMID');
for deleteCitation in deleteTag:
        pmid = newdoc.createElement("id");
	pmid.appendChild(newdoc.createTextNode(deleteCitation.text));
	
	deleteDocs.append(pmid);

for i in range(serverNum):
	for j in docs:
		add_element.appendChild(j);
 	for d in deleteDocs:
		delete_element.appendChild(d);
	top_element.appendChild(add_element);
	top_element.appendChild(delete_element);
	outFile = codecs.open(sys.argv[3],'w','utf-8');
	newdoc.writexml(outFile,"","","\n","utf-8");
	outFile.flush();
	outFile.close();
	newdoc = impl.createDocument(None,"update",None);
	top_element = newdoc.documentElement;
	add_element = newdoc.createElement("add");
	delete_element = newdoc.createElement("delete");	
