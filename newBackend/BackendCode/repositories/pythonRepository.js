// handles data access for Python service, sending CSV and parameters via FormData

require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

class PythonRepository {
  constructor() {
    this.filePath = path.resolve(process.env.RAW_CSV_PATH); //uses raw CSV instead of db
    this.baseUrl = process.env.PYTHON_URL || 'http://localhost:5000';
  }

  buildForm(fields) {
    const form = new FormData();
    form.append('file', fs.createReadStream(this.filePath));

    for (const key in fields) {
      const value = fields[key];
      form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }

    return form;
  }

  async postToEndpoint(endpoint, fields, responseType = 'json') {
    const form = this.buildForm(fields);

    try {
      const response = await axios.post(`${this.baseUrl}/${endpoint}`, form, {
        headers: form.getHeaders(),
        responseType
      });
      return response.data;
    } catch (err) {
      const errorDetails = err.response?.data || err.message;
      console.error(`Error posting to ${endpoint}:`, errorDetails);
      throw new Error(JSON.stringify(errorDetails));
    }
  }
}

module.exports = PythonRepository;