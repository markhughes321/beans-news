import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Link,
} from '@mui/material';

const ArticlesTable = ({ articles, onDelete }) => (
  <TableContainer component={Paper} sx={{ mt: 2 }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Category</TableCell>
          <TableCell>Geotag</TableCell>
          <TableCell>Sent to Shopify</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {articles.map((article) => (
          <TableRow key={article.uuid}>
            <TableCell>{article.title}</TableCell>
            <TableCell>{article.category}</TableCell>
            <TableCell>{article.geotag || '-'}</TableCell>
            <TableCell>{article.sentToShopify ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              <Link
                component={RouterLink}
                to={`/article/edit/${article.uuid}`}
                sx={{ mr: 1 }}
              >
                Edit
              </Link>
              <Button
                color="error"
                onClick={() => onDelete(article.uuid)}
                size="small"
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default ArticlesTable;