import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Link, Checkbox, Box, Typography } from "@mui/material";
import { formatDate } from "../../utils/formatDate";

const ArticlesTable = ({ articles, onBulkEdit }) => {
  const [selected, setSelected] = useState([]);

  const handleSelect = (uuid) => {
    setSelected((prev) => (prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]));
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) setSelected(articles.map((article) => article.uuid));
    else setSelected([]);
  };

  const handleBulkEdit = (status) => {
    onBulkEdit(selected, "moderationStatus", status);
    setSelected([]);
  };

  return (
    <Box>
      {selected.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" onClick={() => handleBulkEdit("scraped")} sx={{ mr: 2 }}>
            Mark as Scraped ({selected.length})
          </Button>
          <Button variant="contained" color="error" onClick={() => handleBulkEdit("rejected")} sx={{ mr: 2 }}>
            Mark as Rejected ({selected.length})
          </Button>
          <Button variant="contained" color="info" onClick={() => handleBulkEdit("aiProcessed")} sx={{ mr: 2 }}>
            Mark as AI Processed
          </Button>
          <Button variant="contained" color="secondary" onClick={() => handleBulkEdit("sentToShopify")}>
            Mark as Sent to Shopify
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
              <TableCell>Moderation Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography>No articles available.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.uuid}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.includes(article.uuid)} onChange={() => handleSelect(article.uuid)} />
                  </TableCell>
                  <TableCell>{article.title}</TableCell>
                  <TableCell>{article.source}</TableCell>
                  <TableCell>{article.publishedAt ? formatDate(article.publishedAt) : "-"}</TableCell>
                  <TableCell>{article.category}</TableCell>
                  <TableCell>{article.geotag || "-"}</TableCell>
                  <TableCell>{article.moderationStatus}</TableCell>
                  <TableCell>
                    <Link component={RouterLink} to={`/article/edit/${article.uuid}`} state={{ from: "/admin" }} sx={{ mr: 1 }}>
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ArticlesTable;