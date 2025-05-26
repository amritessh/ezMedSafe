import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';

const user = process.env.NEO4J_USERNAME || 'neo4j';

const password = process.env.NEO4J_PASSWORD || 'sxLFJnuGV-W6YrgWufHNWHYYTWMY5a7v5YIH372SgNY';

const driver = neo4j.driver(uri,neo4j.auth.basic(user,password));

driver.verifyConnectivity()
.then(()=>console.log('Neo4j Driver connected successfully'))
.catch(error => console.error('Neo4j Driver connection failed:',error));

export default driver;