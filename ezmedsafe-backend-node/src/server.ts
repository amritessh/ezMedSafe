import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 

app.get('/health', (req, res) => {
  res.status(200).send('ezMedSafe Backend OK');
});

app.listen(PORT, () => {
  console.log(`ezMedSafe Backend is running on port ${PORT}`);
});
