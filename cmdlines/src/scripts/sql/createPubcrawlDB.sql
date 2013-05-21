
CREATE DATABASE `pubcrawl`;

use pubcrawl;


CREATE TABLE `singletermcount` (
  `term1` varchar(255) NOT NULL default '',
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);


CREATE TABLE `singletermcount_alias` (
  `term1` varchar(255) NOT NULL default '',
  `alias` varchar(255) default NULL,
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);

CREATE TABLE `singletermcount_denovo` (
  `term1` varchar(255) NOT NULL default '',
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);


CREATE TABLE `singletermcount_denovo_alias` (
  `term1` varchar(255) NOT NULL default '',
  `alias` varchar(255) default NULL,
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);

CREATE TABLE `term_aliases` (
  `alias_id` int(11) NOT NULL default '0',
  `value` varchar(255) NOT NULL default '',
  `exclude` tinyint(1) NOT NULL,
  PRIMARY KEY  (`alias_id`,`value`)
);

 CREATE TABLE `term_mapping` (
  `term_id` int(11) NOT NULL,
  `term_value` varchar(255) NOT NULL,
  `exclude` tinyint(1) NOT NULL,
  `tf` tinyint(1) NOT NULL default '0',
  `geneLength` int(11) NOT NULL default '300',
  PRIMARY KEY  (`term_id`,`term_value`)
);

 CREATE TABLE `denovo_search_terms` (
  `term_value` varchar(255) NOT NULL,
  `term_alias` varchar(255),
  `alias` tinyint(1) NOT NULL
);

CREATE TABLE `singletermcount_drug` (
  `term1` varchar(255) NOT NULL default '',
  `count` int(11) default NULL,
  PRIMARY KEY  (`term1`)
);

ALTER TABLE 'term_aliases' ADD CONSTRAINT 'id_fk1' FOREIGN KEY ('alias_id') REFERENCES 'term_mapping' ('term_id') ON DELETE CASCADE ON UPDATE CASCADE;
