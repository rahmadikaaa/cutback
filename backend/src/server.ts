import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;

app.listen(port as number, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

