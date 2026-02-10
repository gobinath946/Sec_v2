import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Checkbox,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Badge,
  Alert,
  TextField,
  Grid,
  Collapse,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import SendIcon from "@mui/icons-material/Send";
import FilterListIcon from "@mui/icons-material/FilterList";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ImageDistributor from "../../ImagesProvider/ImageDistributor";
import {
  DataTable,
  SectionHeader,
  CustomerInfoCard,
  TermsCard,
} from "./BwdQuoteComponents";

const BwdQuote = ({ quoteData, msg_id, uid, is_readable }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const Tempname = sessionStorage.getItem("TempName");
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [additionalComments, setAdditionalComments] = useState({});
  const [techContactEditing, setTechContactEditing] = useState(false);
  const [techContactData, setTechContactData] = useState({});

  // Initialize selected items state by line item type
  const [selectedItems, setSelectedItems] = useState({});

  // Process quote data and extract line items
  const [processedData, setProcessedData] = useState({
    lineItemsByType: {},
    account: null,
    contact: null,
    technicalContact: null,
    quoteInfo: null,
  });
  console.log(processedData.account);
  useEffect(() => {
    if (quoteData && quoteData.Bwd_Quote && quoteData.Bwd_Quote.quotes) {
      const quote = quoteData.Bwd_Quote.quotes[0];

      // Set account and contact info
      setProcessedData((prev) => ({
        ...prev,
        account: quote.Account || {},
        contact: quote.Contact || {},
        technicalContact: quote.TechnicalContact || {},
        quoteInfo: quote,
      }));

      // Set technical contact data for editing
      setTechContactData(quote.TechnicalContact || {});

      // Process line items
      processLineItems(quote);
    }
  }, [quoteData]);

  const processLineItems = (quote) => {
    const lineItemsByType = {};

    // First, extract line items from the nested structure
    const extractLineItems = (itemsArray, type) => {
      if (!itemsArray || itemsArray.length === 0) return [];

      // For each line item array entry, extract the actual line items
      const allItems = [];
      itemsArray.forEach((wrapper) => {
        if (wrapper[type] && Array.isArray(wrapper[type])) {
          allItems.push(...wrapper[type]);
        }
      });
      return allItems;
    };

    // Process different types of line items
    if (quote.Line_Items && Array.isArray(quote.Line_Items)) {
      const lineItemTypes = [
        { key: "cableLineItems", name: "Cable", pricesKey: "Cable_Prices" },
        {
          key: "localConnectivityLineItems",
          name: "Local Connectivity",
          pricesKey: "Local_Connectivity_Prices",
        },
        { key: "iaasLineItems", name: "IAAS", pricesKey: "IAAS_Prices" },
        { key: "dcLineItems", name: "Data Center", pricesKey: "DC_Prices" },
      ];

      lineItemTypes.forEach(({ key, pricesKey }) => {
        const items = extractLineItems(quote.Line_Items, key);

        if (items.length > 0) {
          const formattedItems = [];

          items.forEach((lineItem) => {
            if (lineItem[pricesKey] && Array.isArray(lineItem[pricesKey])) {
              lineItem[pricesKey].forEach((price) => {
                // Create a structured item based on price type
                const baseItem = {
                  lineItemId: lineItem.Id,
                  priceId: price.Id,
                  name: lineItem.Name,
                  product:
                    lineItem.Product?.Name || lineItem.Products?.Name || "N/A",
                  quantity: lineItem.Quantity || 0,
                  comments:
                    lineItem.Comment_Notes || lineItem.Comments_Notes || "",
                  targetDelivery:
                    lineItem.Target_Delivery_Date ||
                    lineItem.Target_Delivery ||
                    "",
                };

                // Determine item type based on price structure
                const type = price.Type || "Standard";
                const dynamicItem = { ...baseItem, type };

                // Add specific fields based on line item type
                if (key === "cableLineItems") {
                  dynamicItem.route = lineItem.Routes || "N/A";
                  dynamicItem.capacity = lineItem.Capacitys || "N/A";
                  dynamicItem.aEnd = lineItem.A_End_DC_Code || "N/A";
                  dynamicItem.bEnd = lineItem.B_End_DC_Code || "N/A";

                  // Add POP demarcation if available
                  if (lineItem.PopA_demarcation) {
                    dynamicItem.aEnd += ` (${lineItem.PopA_demarcation})`;
                  }
                  if (lineItem.PopB_Demarcation) {
                    dynamicItem.bEnd += ` (${lineItem.PopB_Demarcation})`;
                  }
                } else if (
                  key === "localConnectivityLineItems" ||
                  key === "iaasLineItems"
                ) {
                  dynamicItem.route = lineItem.Route || "N/A";
                  dynamicItem.capacity = lineItem.Capacitys || "N/A";
                  dynamicItem.aEnd = lineItem.A_End_Dc_Code || "N/A";
                  dynamicItem.bEnd = lineItem.B_End_DC_Code || "N/A";
                } else if (key === "dcLineItems") {
                  dynamicItem.minLoad = lineItem.Min_IT_Load_in_MW || "N/A";
                  dynamicItem.maxLoad = lineItem.Max_IT_Load_in_MW || "N/A";
                  dynamicItem.rackDensity =
                    lineItem.Rack_density_in_kW || "N/A";
                  dynamicItem.service = lineItem.Service || "N/A";
                }

                // Add price details based on price type
                if (type === "Lease" || type === "Standard") {
                  dynamicItem.term =
                    price.Term_In_months || price.Terms_in_months || "N/A";
                  dynamicItem.nrc = parseFloat(price.NRC) || 0;
                  dynamicItem.mrc = parseFloat(price.MRC) || 0;

                  // DC specific fields
                  if (key === "dcLineItems") {
                    dynamicItem.power = parseFloat(price.Power) || 0;
                  }
                } else if (type === "IRU") {
                  dynamicItem.term =
                    price.Term_In_months || price.Terms_in_months || "N/A";
                  dynamicItem.iruFee =
                    parseFloat(price.IRU_Fee || price.IRUFee) || 0;
                  dynamicItem.oAndM = parseFloat(price.O_M) || 0;
                }

                formattedItems.push(dynamicItem);
              });
            }
          });

          // Group items by type (Lease, IRU, Standard)
          const itemsByType = {};
          formattedItems.forEach((item) => {
            const typeKey = item.type || "Standard";
            if (!itemsByType[typeKey]) {
              itemsByType[typeKey] = [];
            }
            itemsByType[typeKey].push(item);
          });

          lineItemsByType[key] = itemsByType;
        }
      });
    }

    setProcessedData((prev) => ({
      ...prev,
      lineItemsByType,
    }));
  };

  // Handle checkbox selection
  const handleSelectItem = (itemType, lineItemId, priceId) => {
    setSelectedItems((prev) => {
      const newSelectedItems = { ...prev };

      if (!newSelectedItems[itemType]) {
        newSelectedItems[itemType] = {};
      }

      if (
        !newSelectedItems[itemType][lineItemId] ||
        !newSelectedItems[itemType][lineItemId].includes(priceId)
      ) {
        newSelectedItems[itemType][lineItemId] = [
          ...(newSelectedItems[itemType][lineItemId] || []),
          priceId,
        ];
      } else {
        newSelectedItems[itemType][lineItemId] = newSelectedItems[itemType][
          lineItemId
        ].filter((id) => id !== priceId);

        if (newSelectedItems[itemType][lineItemId].length === 0) {
          delete newSelectedItems[itemType][lineItemId];
        }
      }

      return newSelectedItems;
    });
  };

  // Toggle comment expansion
  const toggleCommentExpansion = (lineItemId, priceId) => {
    const key = `${lineItemId}-${priceId}`;
    setExpandedComments((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Update additional comments
  const handleAdditionalCommentChange = (lineItemId, priceId, value) => {
    const key = `${lineItemId}-${priceId}`;
    setAdditionalComments((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle tech contact editing
  // Replace the toggleTechContactEditing function with this:
  const toggleTechContactEditing = () => {
    if (techContactEditing) {
      // Save the edited data to the processed data when saving
      setProcessedData((prev) => ({
        ...prev,
        technicalContact: { ...techContactData },
      }));
    } else {
      // When starting to edit, ensure we're working with the latest data
      setTechContactData(processedData.technicalContact || {});
    }
    setTechContactEditing(!techContactEditing);
  };

  const handleTechContactChange = (field, value) => {
    setTechContactData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Create the Salesforce payload structure
  const createSalesforcePayload = () => {
    const quote = quoteData.Bwd_Quote.quotes[0];
    const quoteId = quote.Id;
    const quoteNumber = quote.QuoteNumber;

    // Structure for a quote with selected items
    const formattedQuote = {
      Id: quoteId,
      Opportunity: { Id: msg_id },
      QuoteNumber: quoteNumber,
      TechnicalContact: processedData.technicalContact,
      cableLineItems: [],
      localConnectivityLineItems: [],
      iaasLineItems: [],
      dcLineItems: [],
    };

    // Helper function to format line items by type
    const formatLineItems = (type, key, pricesKey) => {
      Object.entries(selectedItems[type] || {}).forEach(
        ([lineItemId, priceIds]) => {
          const lineItem = {
            Id: lineItemId,
            [pricesKey]: priceIds.map((priceId) => {
              const commentKey = `${lineItemId}-${priceId}`;
              return {
                Id: priceId,
                Checkbox: "true",
                Additional_Comments: additionalComments[commentKey] || "",
                [`${key}lineitem`]: { Id: lineItemId },
              };
            }),
          };
          formattedQuote[type].push(lineItem);
        }
      );
    };

    // Format each type of line item
    formatLineItems("cableLineItems", "Cable", "Cable_Prices");
    formatLineItems(
      "localConnectivityLineItems",
      "Localconnectivity",
      "Local_Connectivity_Prices"
    );
    formatLineItems("iaasLineItems", "Iaas", "IAAS_Prices");
    formatLineItems("dcLineItems", "dc", "DC_Prices");

    return {
      QuoteDetails: [formattedQuote],
    };
  };

  // Handle submit of selected items
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Prepare the payload for Salesforce
      const payload = createSalesforcePayload();

      console.log("Sending payload:", payload);

      // Make API call to Salesforce
      const response = await axios.post(
        "https://flow-energy-6774--uat.sandbox.my.salesforce-sites.com/services/apexrest/UpdateLineItems/",
        payload
      );

      if (response.status === 200) {
        navigate(`/result/success/${Tempname}Result`);
        enqueueSnackbar("Items successfully updated!", { variant: "success" });
      } else {
        throw new Error("Failed to update items");
      }
    } catch (error) {
      console.error("Error updating line items:", error);
      enqueueSnackbar("Failed to update items. Please try again.", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Count selected items for summary
  const countSelectedItems = () => {
    let count = 0;
    Object.values(selectedItems).forEach((itemType) => {
      Object.values(itemType).forEach((prices) => {
        count += prices.length;
      });
    });
    return count;
  };

  // Generate dynamic column configurations based on line item type
  const getColumnConfig = (itemType, subType) => {
    const baseColumns = [
      { id: "product", label: "Product", mobileVisible: true },
      { id: "quantity", label: "Quantity", mobileVisible: false },
      { id: "term", label: "Term (Months)", mobileVisible: true },
    ];

    // Different columns based on item type
    if (itemType === "dcLineItems") {
      return [
        ...baseColumns,
        { id: "minLoad", label: "Min IT Load (MW)", mobileVisible: false },
        { id: "maxLoad", label: "Max IT Load (MW)", mobileVisible: false },
        { id: "rackDensity", label: "Rack Density (kW)", mobileVisible: true },
        { id: "nrc", label: "NRC (USD)", mobileVisible: true, isPrice: true },
        { id: "mrc", label: "MRC (USD)", mobileVisible: true, isPrice: true },
        {
          id: "power",
          label: "Power (USD)",
          mobileVisible: false,
          isPrice: true,
        },
        {
          id: "targetDelivery",
          label: "Target Delivery",
          mobileVisible: false,
        },
      ];
    } else {
      // For cable, local connectivity, and IAAS items
      const baseNetworkColumns = [
        ...baseColumns,
        { id: "route", label: "Route", mobileVisible: true },
        { id: "capacity", label: "Capacity", mobileVisible: true },
        { id: "aEnd", label: "POP A", mobileVisible: false },
        { id: "bEnd", label: "POP B", mobileVisible: false },
        {
          id: "targetDelivery",
          label: "Target Delivery",
          mobileVisible: false,
        },
      ];

      if (subType === "Lease" || subType === "Standard") {
        return [
          ...baseNetworkColumns,
          { id: "nrc", label: "NRC (USD)", mobileVisible: true, isPrice: true },
          { id: "mrc", label: "MRC (USD)", mobileVisible: true, isPrice: true },
        ];
      } else if (subType === "IRU") {
        return [
          ...baseNetworkColumns,
          {
            id: "iruFee",
            label: "IRU Fee (USD)",
            mobileVisible: true,
            isPrice: true,
          },
          {
            id: "oAndM",
            label: "O&M (USD)",
            mobileVisible: true,
            isPrice: true,
          },
        ];
      }
    }

    return baseColumns; // Default columns
  };

  // Check if quote data exists
  if (!quoteData || !quoteData.Bwd_Quote || !quoteData.Bwd_Quote.quotes) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        Quote data not available. Please try again later.
      </Alert>
    );
  }

  const quote = quoteData.Bwd_Quote.quotes[0];

  return (
    <Box
      sx={{
        width: "100%",
        margin: "0 auto",
        p: { xs: 1, sm: 2, md: 3 },
        bgcolor: "background.default",
      }}
    >
      {/* Header */}
      <Card
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: theme.shape.borderRadius,
          background: "#3c4281",
          color: "white",
          textAlign: "center",
          py: 2,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ width: isSmallScreen ? "30%" : "8%", borderRadius: "50px" }}>
          <ImageDistributor
            uid={uid}
            logo={"Main_Logo"}
            width="100%"
            height={"auto"}
            borderRadius={"20px"}
          />
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" },
            }}
          >
            Quote Proposal - BWD
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              opacity: 0.9,
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
            }}
          >
            Quote #{quote.QuoteNumber}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" },
            }}
          >
            {processedData?.account?.Name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              opacity: 0.9,
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
            }}
          >
            {processedData?.account?.Phone}
          </Typography>
        </Box>
        {/* Spacer for symmetry */}
      </Card>

      {/* Contact Information Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Account Info */}
        <Grid item xs={12} md={6} lg={4}>
          <CustomerInfoCard
            title="Account Information"
            icon={<AccountCircleIcon fontSize="small" />}
            data={processedData.account}
            fields={[
              { label: "Name", key: "Name" },
              { label: "Email", key: "Email" },
              { label: "Phone", key: "Phone" },
              {
                label: "Address",
                keys: [
                  "BillingStreet",
                  "BillingCity",
                  "BillingState",
                  "BillingPostalCode",
                  "BillingCountry",
                ],
              },
            ]}
          />
        </Grid>

        {/* Contact Info */}
        <Grid item xs={12} md={6} lg={4}>
          <CustomerInfoCard
            title="Contact Information"
            icon={<ContactMailIcon fontSize="small" />}
            data={processedData.contact}
            fields={[
              { label: "Name", key: "Name" },
              { label: "Email", key: "Email" },
              { label: "Phone", key: "Phone" },
              {
                label: "Address",
                keys: [
                  "MailingStreet",
                  "MailingCity",
                  "MailingState",
                  "MailingPostalCode",
                  "MailingCountry",
                ],
              },
            ]}
          />
        </Grid>

        {/* Technical Contact Info (Editable) */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ContactPhoneIcon sx={{ mr: 1, color: "#3c4281" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Technical Contact
                  </Typography>
                </Box>
                {is_readable ? null : (
                  <Button
                    size="small"
                    startIcon={techContactEditing ? <SaveIcon /> : <EditIcon />}
                    onClick={toggleTechContactEditing}
                    color="primary"
                    variant={techContactEditing ? "contained" : "outlined"}
                    sx={{ ml: 1 }}
                  >
                    {techContactEditing ? "Save" : "Edit"}
                  </Button>
                )}
                {techContactEditing && (
                  <Button
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={toggleTechContactEditing}
                    color="error"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {techContactEditing ? (
                  // Editable form
                  <>
                    <TextField
                      fullWidth
                      size="small"
                      label="FirstName"
                      value={techContactData.FirstName || ""}
                      onChange={(e) =>
                        handleTechContactChange("FirstName", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="LastName"
                      value={techContactData.LastName || ""}
                      onChange={(e) =>
                        handleTechContactChange("LastName", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Email"
                      value={techContactData.Email || ""}
                      onChange={(e) =>
                        handleTechContactChange("Email", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone"
                      value={techContactData.Phone || ""}
                      onChange={(e) =>
                        handleTechContactChange("Phone", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="MailingStreet"
                      value={techContactData.MailingStreet || ""}
                      onChange={(e) =>
                        handleTechContactChange("MailingStreet", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="MailingCity"
                      value={techContactData.MailingCity || ""}
                      onChange={(e) =>
                        handleTechContactChange("MailingCity", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="MailingState"
                      value={techContactData.MailingState || ""}
                      onChange={(e) =>
                        handleTechContactChange("MailingState", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="MailingPostalCode"
                      value={techContactData.MailingPostalCode || ""}
                      onChange={(e) =>
                        handleTechContactChange(
                          "MailingPostalCode",
                          e.target.value
                        )
                      }
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="MailingCountry"
                      value={techContactData.MailingCountry || ""}
                      onChange={(e) =>
                        handleTechContactChange(
                          "MailingCountry",
                          e.target.value
                        )
                      }
                    />
                  </>
                ) : (
                  // Read-only display
                  <>
                    <Typography variant="body2">
                      <strong>Name:</strong>{" "}
                      {techContactData.FirstName + techContactData.LastName ||
                        "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {techContactData.Email || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {techContactData.Phone || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Address:</strong>{" "}
                      {`${techContactData.MailingStreet || ""}, ${
                        techContactData.MailingCity || ""
                      }, ${techContactData.MailingState || ""}, ${
                        techContactData.MailingPostalCode || ""
                      }, ${techContactData.MailingCountry || "N/A"}`}
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dynamic Line Item Tables */}
      {Object.entries(processedData.lineItemsByType).map(
        ([itemTypeKey, itemsBySubType]) =>
          Object.entries(itemsBySubType).map(([subType, items]) => {
            if (items.length === 0) return null;

            // Generate appropriate title
            let title;
            if (itemTypeKey === "dcLineItems") {
              title = "Data Center Items";
            } else if (itemTypeKey === "cableLineItems") {
              title = `Cable ${subType} Items`;
            } else if (itemTypeKey === "localConnectivityLineItems") {
              title = `Local Connectivity ${subType} Items`;
            } else if (itemTypeKey === "iaasLineItems") {
              title = `IAAS ${subType} Items`;
            }

            return (
              <DataTable
                key={`${itemTypeKey}-${subType}`}
                title={title}
                items={items}
                type={itemTypeKey}
                columns={getColumnConfig(itemTypeKey, subType)}
                selectedItems={selectedItems}
                handleSelectItem={handleSelectItem}
                expandedComments={expandedComments}
                toggleCommentExpansion={toggleCommentExpansion}
                additionalComments={additionalComments}
                handleAdditionalCommentChange={handleAdditionalCommentChange}
                icon={<InfoIcon fontSize="small" />}
                is_readable={is_readable}
              />
            );
          })
      )}

      {/* Terms & Conditions */}
      <TermsCard quoteInfo={quote} />

      {/* Action Footer */}
      {is_readable ? null : (
        <Card
          elevation={0}
          sx={{
            position: "sticky",
            bottom: 0,
            left: 0,
            zIndex: 10,
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Badge
              badgeContent={countSelectedItems()}
              color="primary"
              sx={{ mr: 2 }}
            >
              <FilterListIcon />
            </Badge>
            <Typography variant="body2">
              {countSelectedItems()}{" "}
              {countSelectedItems() === 1 ? "item" : "items"} selected
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={countSelectedItems() === 0 || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            size={isSmallScreen ? "small" : "medium"}
            sx={{
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              background: "#3c4281",
              borderRadius: "4px",
            }}
          >
            {loading ? "Submitting..." : "Submit Selection"}
          </Button>
        </Card>
      )}
    </Box>
  );
};

export default BwdQuote;
