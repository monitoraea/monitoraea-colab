const fs = require('fs');

const db = require('../database');
const Sequelize = require('sequelize');

const YAML = require('yaml')

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect } = require('../../utils');

class Service {
  /* Entity */ 

  async get(id) {   
    const formFile = fs.readFileSync('./services/form/form1.yml', 'utf8') // TMP 
    return YAML.parse(formFile)    
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;