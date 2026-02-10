import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  TextField,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

// Reusable section header component
export const SectionHeader = ({ title, count, icon }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 2,
        pb: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {icon && (
        <Box
          component="span"
          sx={{
            mr: 1,
            display: "flex",
            alignItems: "center",
            color: "#3c4281",
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "#3c4281",
          fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
        }}
      >
        {title}
      </Typography>
      {count !== undefined && (
        <Box
          component="span"
          sx={{
            ml: 1,
            px: 1,
            py: 0.5,
            fontSize: "0.7rem",
            borderRadius: "12px",
            background: "#3c4281",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "24px",
            height: "20px",
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );
};

// Customer info card component
export const CustomerInfoCard = ({ title, icon, data, fields }) => {
  const theme = useTheme();

  if (!data) return null;

  const formatAddress = (data, keys) => {
    if (!Array.isArray(keys)) return data[keys] || "N/A";

    return (
      keys
        .map((key) => data[key])
        .filter(Boolean)
        .join(", ") || "N/A"
    );
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {icon && <Box sx={{ mr: 1, color: "#3c4281" }}>{icon}</Box>}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {fields.map((field) => (
            <Typography key={field.label} variant="body2">
              <strong>{field.label}:</strong>{" "}
              {field.keys
                ? formatAddress(data, field.keys)
                : data[field.key] || "N/A"}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Terms card component
export const TermsCard = ({ quoteInfo }) => {
  const theme = useTheme();

  if (!quoteInfo) return null;

  const terms = [
    { label: "Confidentiality", value: quoteInfo.Confidentiality },
    { label: "Currency", value: quoteInfo.Currencys },
    { label: "Payment terms", value: quoteInfo.Payment_Terms },
    { label: "Validity", value: quoteInfo.Validity },
    { label: "Special Notes", value: quoteInfo.Special_Notes },
  ];

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <CardContent>
        <SectionHeader
          title="Terms & Conditions"
          icon={<LocalOfferIcon fontSize="small" />}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          {terms.map((term) => (
            <Box key={term.label}>
              {term?.value?.length > 0 ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {term.label}:
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {term.value || "N/A"}
                  </Typography>
                </>
              ) : null}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Data table component for displaying line items
export const DataTable = ({
  title,
  items,
  type,
  columns,
  selectedItems,
  handleSelectItem,
  expandedComments,
  toggleCommentExpansion,
  additionalComments,
  handleAdditionalCommentChange,
  icon,
  is_readable
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Helper function to format price values
  const formatPrice = (value) => {
    if (value === undefined || value === null) return "N/A";
    return `$${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Function to determine if an item is selected
  const isItemSelected = (lineItemId, priceId) => {
    return (
      selectedItems[type] &&
      selectedItems[type][lineItemId] &&
      selectedItems[type][lineItemId].includes(priceId)
    );
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        overflow: "hidden",
      }}
    >
      <CardContent>
        <SectionHeader title={title} count={items.length} icon={icon} />
        <TableContainer>
          <Table size="small">
            {/* Table Headers */}
            <TableHead>
              <TableRow sx={{ backgroundColor: "rgba(60, 66, 129, 0.05)" }}>
                <TableCell padding="checkbox">
                  <Checkbox disabled />
                </TableCell>
                {columns.map(
                  (column) =>
                    (!isSmallScreen || column.mobileVisible) && (
                      <TableCell
                        key={column.id}
                        align={column.isPrice ? "right" : "left"}
                        sx={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        {column.label}
                      </TableCell>
                    )
                )}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Comments
                </TableCell>
              </TableRow>
            </TableHead>

            {/* Table Body */}
            <TableBody>
              {items.map((item) => {
                const commentKey = `${item.lineItemId}-${item.priceId}`;
                const isExpanded = expandedComments[commentKey];

                return (
                  <React.Fragment key={`${item.lineItemId}-${item.priceId}`}>
                    <TableRow
                      hover
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(0, 0, 0, 0.02)",
                        },
                        ...(isItemSelected(item.lineItemId, item.priceId) && {
                          backgroundColor: "rgba(60, 66, 129, 0.12) !important",
                        }),
                      }}
                    >
                      {/* Selection Checkbox */}
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected(
                            item.lineItemId,
                            item.priceId
                          )}
                          disabled={is_readable}
                          onChange={() =>
                            handleSelectItem(
                              type,
                              item.lineItemId,
                              item.priceId
                            )
                          }
                        />
                      </TableCell>

                      {/* Dynamic Content Columns */}
                      {columns.map(
                        (column) =>
                          (!isSmallScreen || column.mobileVisible) && (
                            <TableCell
                              key={column.id}
                              align={column.isPrice ? "right" : "left"}
                              sx={{
                                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                              }}
                            >
                              {column.isPrice
                                ? formatPrice(item[column.id])
                                : item[column.id]}
                            </TableCell>
                          )
                      )}

                      {/* Comments Toggle */}
                      <TableCell align="center">
                        <Tooltip title="Toggle Comments">
                          <IconButton
                            size="small"
                            onClick={() =>
                              toggleCommentExpansion(
                                item.lineItemId,
                                item.priceId
                              )
                            }
                          >
                            {item.comments ? (
                              <CommentIcon fontSize="small" color="primary" />
                            ) : isExpanded ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Comments Row */}
                    <TableRow>
                      <TableCell
                        colSpan={
                          columns.filter(
                            (col) => !isSmallScreen || col.mobileVisible
                          ).length + 2
                        }
                        sx={{
                          p: 0,
                          borderBottom: isExpanded
                            ? `1px solid ${theme.palette.divider}`
                            : "none",
                        }}
                      >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box
                            sx={{
                              py: 1,
                              px: 2,
                              backgroundColor: "rgba(0, 0, 0, 0.01)",
                            }}
                          >
                            {item.comments && (
                              <Typography
                                variant="body2"
                                sx={{ mb: 2, whiteSpace: "pre-wrap" }}
                              >
                                <strong>Original Comments:</strong>{" "}
                                {item.comments}
                              </Typography>
                            )}

                            <TextField
                              label="Additional Comments"
                              placeholder="Add your comments here..."
                              fullWidth
                              multiline
                              rows={2}
                              variant="outlined"
                              size="small"
                              value={additionalComments[commentKey] || ""}
                              onChange={(e) =>
                                handleAdditionalCommentChange(
                                  item.lineItemId,
                                  item.priceId,
                                  e.target.value
                                )
                              }
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  fontSize: "0.875rem",
                                },
                              }}
                            />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
