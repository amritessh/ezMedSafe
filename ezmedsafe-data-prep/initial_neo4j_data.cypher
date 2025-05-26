
            // Delete existing data (for clean re-runs during dev)
            MATCH (n) DETACH DELETE n;

            // Create Drugs
            CREATE (w:Drug {name: 'Warfarin', rxNormId: 'RN123', drugClass: 'Anticoagulant'})
            CREATE (f:Drug {name: 'Fluconazole', rxNormId: 'RN456', drugClass: 'Antifungal'})
            CREATE (o:Drug {name: 'Ondansetron', rxNormId: 'RN789', drugClass: 'Antiemetic'})
            CREATE (d:Drug {name: 'Dofetilide', rxNormId: 'RN012', drugClass: 'Antiarrhythmic'})

            // Create Enzymes, Pathways, Consequences, Patient Characteristics
            CREATE (c2c9:Enzyme {name: 'CYP2C9'})
            CREATE (qt:Pathway {name: 'QT Interval Prolongation'})
            CREATE (bleeding:ClinicalConsequence {name: 'Increased Bleeding Risk', severity: 'High'})
            CREATE (torsades:ClinicalConsequence {name: 'Risk of Torsades de Pointes', severity: 'Critical'})
            CREATE (hepatic:PatientCharacteristic {name: 'Hepatic Impairment'})
            CREATE (renal:PatientCharacteristic {name: 'Renal Impairment'})
            CREATE (cardiac:PatientCharacteristic {name: 'Cardiac Disease'})

            // Define Relationships for Warfarin-Fluconazole
            CREATE (f)-[:INHIBITS]->(c2c9)
            CREATE (c2c9)-[:METABOLIZES]->(w)
            CREATE (w)-[:LEADS_TO]->(bleeding)
            CREATE (f)-[:INTERACTS_WITH {mechanism: 'CYP2C9 Inhibition', notes: 'Fluconazole significantly inhibits the metabolism of S-warfarin'}]->(w)
            CREATE (f)-[:INTERACTS_WITH]->(w)-[:INCREASES_RISK_OF]->(bleeding)
            CREATE (w)-[:EXACERBATED_BY]->(hepatic)
            CREATE (w)-[:EXACERBATED_BY]->(renal)

            // Define Relationships for QT Prolongation (Ondansetron-Dofetilide)
            CREATE (o)-[:CAUSES_SIDE_EFFECT {effect: 'QT Prolongation'}]->(qt)
            CREATE (d)-[:CAUSES_SIDE_EFFECT {effect: 'QT Prolongation'}]->(qt)
            CREATE (o)-[:INTERACTS_WITH {mechanism: 'Additive QT Prolongation', notes: 'Concurrent use increases risk of Torsades de Pointes'}]->(d)
            CREATE (o)-[:INTERACTS_WITH]->(d)-[:INCREASES_RISK_OF]->(torsades)
            CREATE (d)-[:EXACERBATED_BY]->(cardiac)
            ;
            ```
        * **Execute Script:** **D/KG:** Open Neo4j Browser (http://localhost:7474 if using Docker Compose, or your AuraDB URL). Paste the Cypher script and run it. Verify data by querying `MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 25`.

* **Deliverables:**
    * Running Neo4j instance with data.
    * `neo4j-driver` installed in backend.
    * `src/clients/neo4jClient.ts` created and verifying connection.
    * `initial_neo4j_data.cypher` saved in `ezmedsafe-data-prep`.