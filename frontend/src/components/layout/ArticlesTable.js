import React, { useState } from 'react';
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
  Checkbox,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Icon for processedByAI
import StoreIcon from '@mui/icons-material/Store'; // Icon for sentToShopify
import { formatDate } from '../../utils/formatDate';

const ArticlesTable = ({ articles, onDelete, onBulkDelete, onBulkEdit }) => {
  const [selected, setSelected] = useState([]);

  const handleSelect = (uuid) => {
    setSelected((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(articles.map((article) => article.uuid));
    } else {
      setSelected([]);
    }
  };

  const handleBulkDelete = () => {
    onBulkDelete(selected);
    setSelected([]);
  };

  const handleBulkEdit = (field, value) => {
    onBulkEdit(selected, field, value);
    setSelected([]);
  };

  return (
    <Box>
      {selected.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            sx={{ mr: 2 }}
          >
            Delete Selected ({selected.length})
          </Button>
          <Button
            variant="contained"
            onClick={() => handleBulkEdit('sentToShopify', true)}
            sx={{ mr: 2 }}
          >
            Mark as Sent to Shopify
          </Button>
          <Button
            variant="contained"
            onClick={() => handleBulkEdit('processedByAI', true)}
          >
            Mark as Processed by AI
          </Button>
        </Box>
      )}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  onChange={handleSelectAll}
                  checked={selected.length === articles.length && articles.length > 0}
                  indeterminate={selected.length > 0 && selected.length < articles.length}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Published Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Geotag</TableCell>
              <TableCell>AI Processed</TableCell>
              <TableCell>Sent to Shopify</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.uuid}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(article.uuid)}
                    onChange={() => handleSelect(article.uuid)}
                  />
                </TableCell>
                <TableCell>{article.title}</TableCell>
                <TableCell>{article.source}</TableCell>
                <TableCell>{article.publishedAt ? formatDate(article.publishedAt) : '-'}</TableCell>
                <TableCell>{article.category}</TableCell>
                <TableCell>{article.geotag || '-'}</TableCell>
                <TableCell>
                  <Tooltip title={article.processedByAI ? 'Processed by AI' : 'Not Processed by AI'}>
                    <SmartToyIcon
                      fontSize="small"
                      sx={{ color: article.processedByAI ? 'primary.main' : 'text.disabled' }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={article.sentToShopify ? 'Sent to Shopify' : 'Not Sent to Shopify'}>
                    <StoreIcon
                      fontSize="small"
                      sx={{ color: article.sentToShopify ? 'secondary.main' : 'text.disabled' }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Link
                    component={RouterLink}
                    to={`/article/edit/${article.uuid}`}
                    state={{ from: '/admin' }}
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
    </Box>
  );
};

export default ArticlesTable;