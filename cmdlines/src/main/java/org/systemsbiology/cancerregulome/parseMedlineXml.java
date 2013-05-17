package org.systemsbiology.cancerregulome;



import org.w3c.dom.*;

import javax.print.Doc;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.File;
import java.io.IOException;

/**
 * @author aeakin
 */
public class parseMedlineXml {

    public static void main(String[] args){
          //get the factory
		DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();

		try {

			//Using factory get an instance of document builder
			DocumentBuilder db = dbf.newDocumentBuilder();
            DOMImplementation impl = db.getDOMImplementation();
            Document doc = impl.createDocument(null,null,null);
            Element addE = doc.createElement("add");
            doc.appendChild(addE);

			//parse using builder to get DOM representation of the XML file
            Document dom = db.parse(args[0]);
            Element topElement = dom.getDocumentElement();
            NodeList medlineCitations = topElement.getElementsByTagName("MedlineCitation");

            //also setup Xpath
            XPathFactory factory = XPathFactory.newInstance();
            XPath xpath = factory.newXPath();
            XPathExpression medlineDateExpr = xpath.compile("Article/Journal/JournalIssue/PubDate/MedlineDate/text()");
            XPathExpression pubYearExpr = xpath.compile("Article/Journal/JournalIssue/PubDate/Year/text()");
            XPathExpression articleTitleExpr = xpath.compile("Article/ArticleTitle/text()");
            XPathExpression abstractExpr = xpath.compile("Article/Abstract/AbstractText/text()");
            XPathExpression otherAbstractExpr = xpath.compile("OtherAbstract/AbstractText/text()");

            if(medlineCitations != null && medlineCitations.getLength() > 0){
                for(int i=0; i < medlineCitations.getLength(); i++){
                    Element e = (Element) medlineCitations.item(i);
                    Element medCitation = doc.createElement("doc");

                    Element pmidE = createField("pmid",e.getElementsByTagName("PMID").item(0).getFirstChild().getNodeValue(),doc);
                    medCitation.appendChild(pmidE);

                    NodeList medDateList = (NodeList)medlineDateExpr.evaluate(e, XPathConstants.NODESET);
                    if(medDateList != null && medDateList.getLength() > 0){
                        Element medE = createField("pub_date_year",medDateList.item(0).getNodeValue().split(" ")[0],doc);
                        medCitation.appendChild(medE);
                    }
                    else{
                        NodeList medYearList = (NodeList) pubYearExpr.evaluate(e, XPathConstants.NODESET);
                        Element medE = createField("pub_date_year",medYearList.item(0).getNodeValue(),doc);
                        medCitation.appendChild(medE);
                    }

                    Node n = (Node)articleTitleExpr.evaluate(e,XPathConstants.NODE);
                    if(n != null){
                        Element titleE = createField("article_title",n.getNodeValue(),doc);
                        medCitation.appendChild(titleE);
                    }

                    NodeList abstractList = (NodeList)abstractExpr.evaluate(e,XPathConstants.NODESET);
                    if(abstractList != null){
                        String abstractText = "";
                        for(int j=0; j< abstractList.getLength(); j++){
                                 abstractText = abstractText + abstractList.item(j).getNodeValue();
                        }
                        Element abstractE = createField("abstract_text",abstractText,doc);
                        medCitation.appendChild(abstractE);
                    }

                     NodeList otherabstractList = (NodeList)otherAbstractExpr.evaluate(e,XPathConstants.NODESET);
                    if(otherabstractList != null){
                        String abstractText = "";
                        for(int j=0; j< otherabstractList.getLength(); j++){
                                 abstractText = abstractText + otherabstractList.item(j).getNodeValue();
                        }
                        Element otherabstractE = createField("other_abstract",abstractText,doc);
                        medCitation.appendChild(otherabstractE);
                    }

                    addE.appendChild(medCitation);

                }
            }

            DOMSource domSource = new DOMSource(doc);
            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();
            transformer.setOutputProperty(OutputKeys.INDENT,"yes");
            StreamResult result = new StreamResult(new File(args[1]));
            transformer.transform(domSource, result);

            return;



		}catch(Exception e) {
			e.printStackTrace();
		}
    }

    private static Element createField(String name, String value, Document doc){
        Element e = doc.createElement("field");
        e.setAttribute("name",name);
        e.appendChild(doc.createTextNode(value));

        return e;
    }
}
