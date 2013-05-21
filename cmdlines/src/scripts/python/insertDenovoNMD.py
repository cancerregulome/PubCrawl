import sys
import urllib
import urllib2
import ConfigParser

config=ConfigParser.ConfigParser()
config.readfp(open('pubcrawl.properties'))

pubcrawl_deNovo=config.get('pubcrawl','deNovo');


params = {"alias":sys.argv[2]}

print sys.argv[1] + "    " + sys.argv[2];

param_encoded=urllib.urlencode(params);
encoded_node=urllib.quote(sys.argv[1]);

print encoded_node
request_object = urllib2.Request(pubcrawl_deNovo+encoded_node,param_encoded);
response = urllib2.urlopen(request_object);
print response.read();



