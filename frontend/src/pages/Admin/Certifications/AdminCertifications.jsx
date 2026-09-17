
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./AdminCertifications.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const DOCUMENT_TYPES = [
  { value: "certificate", label: "Certificate" },
  { value: "badge", label: "Badge" },
  { value: "license", label: "License" },
  { value: "transcript", label: "Transcript" },
  { value: "other", label: "Other" },
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const createEmptyForm = () => ({
  certificateName: "",
  issuingOrganization: "",
  description: "",
  credentialId: "",
  credentialUrl: "",
  issueDate: "",
  expiryDate: "",
  doesNotExpire: true,
  skills: [],
  technologies: [],
  isVisible: true,
  isFeatured: false,
  isActive: true,
  displayOrder: 0,
});

const normalizeDateForInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

const normalizeCertificationForForm = (certification) => {
  if (!certification) {
    return createEmptyForm();
  }

  return {
    certificateName: certification.certificateName || "",
    issuingOrganization:
      certification.issuingOrganization || "",
    description: certification.description || "",
    credentialId: certification.credentialId || "",
    credentialUrl: certification.credentialUrl || "",
    issueDate: normalizeDateForInput(
      certification.issueDate
    ),
    expiryDate: normalizeDateForInput(
      certification.expiryDate
    ),
    doesNotExpire:
      certification.doesNotExpire !== undefined
        ? Boolean(certification.doesNotExpire)
        : true,
    skills: Array.isArray(certification.skills)
      ? certification.skills
      : [],
    technologies: Array.isArray(certification.technologies)
      ? certification.technologies
      : [],
    isVisible:
      certification.isVisible !== undefined
        ? Boolean(certification.isVisible)
        : true,
    isFeatured: Boolean(certification.isFeatured),
    isActive:
      certification.isActive !== undefined
        ? Boolean(certification.isActive)
        : true,
    displayOrder: certification.displayOrder ?? 0,
  };
};

const getCertificationId = (certification) =>
  certification?.id ||
  certification?._id ||
  "";

const getDocumentId = (document) =>
  document?.id ||
  document?._id ||
  "";

const getDocumentTypeLabel = (type) =>
  DOCUMENT_TYPES.find((item) => item.value === type)
    ?.label || "Other";

const formatFileSize = (bytes) => {
  if (!bytes || Number(bytes) <= 0) {
    return "Unknown size";
  }

  const size = Number(bytes);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const isImageMimeType = (mimeType) =>
  [
    "image/jpeg",
    "image/png",
    "image/webp",
  ].includes(mimeType);

const isPdfMimeType = (mimeType) =>
  mimeType === "application/pdf";

const arrayToText = (value) =>
  Array.isArray(value) ? value.join(", ") : "";

const textToArray = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (value) => {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AdminCertifications = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [form, setForm] = useState(createEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [uploadTargetId, setUploadTargetId] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [documentType, setDocumentType] =
    useState("certificate");
  const [submittingDocument, setSubmittingDocument] =
    useState(false);

  const fileInputRef = useRef(null);
  const replaceFileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({
      id: Date.now(),
      type,
      message,
    });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          credentials: "include",
          ...options,
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        window.location.href = "/admin/login";

        throw new Error(
          "Your admin session has expired. Please login again."
        );
      }

      if (!response.ok) {
        const error = new Error(
          data?.message || "Something went wrong."
        );

        error.responseData = data;

        throw error;
      }

      return data;
    },
    []
  );

  const loadCertifications = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      query.set("page", "1");
      query.set("limit", "100");

      if (search.trim()) {
        query.set("search", search.trim());
      }

      if (visibilityFilter) {
        query.set("visibility", visibilityFilter);
      }

      if (featuredFilter) {
        query.set("featured", featuredFilter);
      }

      if (activeFilter) {
        query.set("active", activeFilter);
      }

      const data = await apiRequest(
        `/api/certifications/admin?${query.toString()}`
      );

      const records =
        Array.isArray(data?.certifications)
          ? data.certifications
          : Array.isArray(data?.result?.certifications)
          ? data.result.certifications
          : Array.isArray(data?.result)
          ? data.result
          : [];

      setCertifications(records);
    } catch (error) {
      console.error(
        "Failed to load certifications:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to load certifications."
      );
    } finally {
      setLoading(false);
    }
  }, [
    apiRequest,
    search,
    visibilityFilter,
    featuredFilter,
    activeFilter,
    showToast,
  ]);

  useEffect(() => {
    loadCertifications();
  }, [loadCertifications]);

  const openCreateForm = () => {
    setEditingId(null);

    setForm({
      ...createEmptyForm(),
      displayOrder: certifications.length,
    });

    setFormOpen(true);
  };

  const openEditForm = (certification) => {
    setEditingId(
      getCertificationId(certification)
    );

    setForm(
      normalizeCertificationForForm(certification)
    );

    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingId(null);
    setForm(createEmptyForm());
  };

  const handleFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayChange = (event, field) => {
    setForm((previous) => ({
      ...previous,
      [field]: textToArray(event.target.value),
    }));
  };

  const validateForm = () => {
    if (!form.certificateName.trim()) {
      showToast(
        "error",
        "Certificate name is required."
      );

      return false;
    }

    if (form.certificateName.trim().length < 2) {
      showToast(
        "error",
        "Certificate name must contain at least 2 characters."
      );

      return false;
    }

    if (!form.issuingOrganization.trim()) {
      showToast(
        "error",
        "Issuing organization is required."
      );

      return false;
    }

    if (!form.issueDate) {
      showToast(
        "error",
        "Issue date is required."
      );

      return false;
    }

    if (
      form.doesNotExpire &&
      form.expiryDate
    ) {
      showToast(
        "error",
        "Expiry date must be empty when certification does not expire."
      );

      return false;
    }

    if (
      !form.doesNotExpire &&
      !form.expiryDate
    ) {
      showToast(
        "error",
        "Expiry date is required when certification has an expiry."
      );

      return false;
    }

    if (
      form.issueDate &&
      form.expiryDate &&
      new Date(form.expiryDate) <
        new Date(form.issueDate)
    ) {
      showToast(
        "error",
        "Expiry date cannot be earlier than issue date."
      );

      return false;
    }

    if (form.credentialUrl.trim()) {
      try {
        const url = new URL(
          form.credentialUrl.trim()
        );

        if (
          !["http:", "https:"].includes(
            url.protocol
          )
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        showToast(
          "error",
          "Please enter a valid HTTP or HTTPS credential URL."
        );

        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      certificateName:
        form.certificateName.trim(),

      issuingOrganization:
        form.issuingOrganization.trim(),

      description:
        form.description.trim(),

      credentialId:
        form.credentialId.trim(),

      credentialUrl:
        form.credentialUrl.trim(),

      issueDate: form.issueDate,

      expiryDate: form.doesNotExpire
        ? null
        : form.expiryDate || null,

      doesNotExpire:
        Boolean(form.doesNotExpire),

      skills: Array.isArray(form.skills)
        ? form.skills
        : [],

      technologies: Array.isArray(
        form.technologies
      )
        ? form.technologies
        : [],

      isVisible:
        Boolean(form.isVisible),

      isFeatured:
        Boolean(form.isFeatured),

      isActive:
        Boolean(form.isActive),

      displayOrder:
        Number(form.displayOrder) || 0,
    };

    try {
      setSaving(true);

      let data;

      if (editingId) {
        data = await apiRequest(
          `/api/certifications/admin/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        data = await apiRequest(
          "/api/certifications/admin",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      }

      showToast(
        "success",
        data?.message ||
          (editingId
            ? "Certification updated successfully."
            : "Certification created successfully.")
      );

      setFormOpen(false);
      setEditingId(null);
      setForm(createEmptyForm());

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to save certification:",
        error
      );

      const validationErrors =
        error?.responseData?.validationErrors;

      if (
        validationErrors &&
        typeof validationErrors === "object"
      ) {
        const firstError = Object.values(
          validationErrors
        )[0];

        showToast(
          "error",
          Array.isArray(firstError)
            ? firstError[0]
            : String(firstError)
        );
      } else {
        showToast(
          "error",
          error.message ||
            "Failed to save certification."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const openConfirmation = ({
    title,
    message,
    confirmText = "Confirm",
    danger = false,
    onConfirm,
  }) => {
    setConfirmModal({
      title,
      message,
      confirmText,
      danger,
      onConfirm,
    });
  };

  const closeConfirmation = () => {
    setConfirmModal(null);
  };

  useEffect(() => {
    if (!confirmModal) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeConfirmation();
      }

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        const callback =
          confirmModal.onConfirm;

        setConfirmModal(null);

        if (typeof callback === "function") {
          callback();
        }
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [confirmModal]);

  const requestDeleteCertification = (
    certification
  ) => {
    const certificationId =
      getCertificationId(certification);

    openConfirmation({
      title: "Delete Certification?",
      message: `This will permanently delete "${certification.certificateName}" and all attached documents. This action cannot be undone.`,
      confirmText: "Delete Certification",
      danger: true,

      onConfirm: async () => {
        try {
          setActionLoading(
            `delete-${certificationId}`
          );

          const data = await apiRequest(
            `/api/certifications/admin/${certificationId}`,
            {
              method: "DELETE",
            }
          );

          showToast(
            "success",
            data?.message ||
              "Certification deleted successfully."
          );

          await loadCertifications();
        } catch (error) {
          console.error(
            "Failed to delete certification:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to delete certification."
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const updateCertificationFlag = async (
    certification,
    field,
    value
  ) => {
    const certificationId =
      getCertificationId(certification);

    const endpointMap = {
      isVisible: "visibility",
      isFeatured: "featured",
      isActive: "active",
    };

    const endpoint = endpointMap[field];

    if (!endpoint) {
      return;
    }

    try {
      setActionLoading(
        `${field}-${certificationId}`
      );

      const data = await apiRequest(
        `/api/certifications/admin/${certificationId}/${endpoint}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [field]: Boolean(value),
          }),
        }
      );

      showToast(
        "success",
        data?.message ||
          "Certification status updated successfully."
      );

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to update certification status:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to update certification status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const updateDisplayOrder = async (
    certification,
    nextOrder
  ) => {
    const certificationId =
      getCertificationId(certification);

    try {
      setActionLoading(
        `order-${certificationId}`
      );

      const data = await apiRequest(
        `/api/certifications/admin/${certificationId}/display-order`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayOrder:
              Number(nextOrder) || 0,
          }),
        }
      );

      showToast(
        "success",
        data?.message ||
          "Certification order updated successfully."
      );

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to update display order:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to update display order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const moveCertification = async (
    index,
    direction
  ) => {
    if (
      direction === "up" &&
      index === 0
    ) {
      return;
    }

    if (
      direction === "down" &&
      index === certifications.length - 1
    ) {
      return;
    }

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    const current = certifications[index];
    const target = certifications[targetIndex];

    const currentId =
      getCertificationId(current);

    const targetId =
      getCertificationId(target);

    const currentOrder =
      Number(current.displayOrder) || index;

    const targetOrder =
      Number(target.displayOrder) || targetIndex;

    try {
      setActionLoading(
        `move-${currentId}`
      );

      await Promise.all([
        apiRequest(
          `/api/certifications/admin/${currentId}/display-order`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              displayOrder: targetOrder,
            }),
          }
        ),

        apiRequest(
          `/api/certifications/admin/${targetId}/display-order`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              displayOrder: currentOrder,
            }),
          }
        ),
      ]);

      showToast(
        "success",
        "Certification order updated successfully."
      );

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to reorder certifications:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to reorder certifications."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const validateDocumentFile = (file) => {
    if (!file) {
      showToast(
        "error",
        "Please select a document."
      );

      return false;
    }

    if (
      !ALLOWED_DOCUMENT_TYPES.includes(
        file.type
      )
    ) {
      showToast(
        "error",
        "Only PDF, JPG, JPEG, PNG, and WEBP files are allowed."
      );

      return false;
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      showToast(
        "error",
        "Certification document must be 10 MB or smaller."
      );

      return false;
    }

    return true;
  };

  const openUploadPicker = (certificationId) => {
    setUploadTargetId(certificationId);
    setDocumentType("certificate");

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!uploadTargetId) {
      return;
    }

    if (!validateDocumentFile(file)) {
      setUploadTargetId(null);
      return;
    }

    try {
      setSubmittingDocument(true);

      const formData = new FormData();

      formData.append("document", file);
      formData.append("documentType", documentType);

      const data = await apiRequest(
        `/api/certifications/admin/${uploadTargetId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      showToast(
        "success",
        data?.message ||
          "Certification document uploaded successfully."
      );

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to upload certification document:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to upload certification document."
      );
    } finally {
      setSubmittingDocument(false);
      setUploadTargetId(null);
    }
  };

  const openReplacePicker = (
    certificationId,
    document
  ) => {
    setReplaceTarget({
      certificationId,
      documentId: getDocumentId(document),
      documentType:
        document.documentType || "certificate",
    });

    setTimeout(() => {
      replaceFileInputRef.current?.click();
    }, 0);
  };

  const handleDocumentReplace = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!replaceTarget) {
      return;
    }

    if (!validateDocumentFile(file)) {
      setReplaceTarget(null);
      return;
    }

    try {
      setSubmittingDocument(true);

      const formData = new FormData();

      formData.append("document", file);
      formData.append(
        "documentType",
        replaceTarget.documentType ||
          "certificate"
      );

      const data = await apiRequest(
        `/api/certifications/admin/${replaceTarget.certificationId}/documents/${replaceTarget.documentId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      showToast(
        "success",
        data?.message ||
          "Certification document replaced successfully."
      );

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to replace certification document:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to replace certification document."
      );
    } finally {
      setSubmittingDocument(false);
      setReplaceTarget(null);
    }
  };

  const previewDocument = async (
    certificationId,
    document
  ) => {
    const documentId = getDocumentId(document);

    if (!certificationId || !documentId) {
      showToast(
        "error",
        "Document information is incomplete."
      );

      return;
    }

    try {
      setActionLoading(
        `preview-${documentId}`
      );

      const data = await apiRequest(
        `/api/certifications/admin/${certificationId}/documents/${documentId}`
      );

      const previewUrl = data?.document?.url;

      if (!previewUrl) {
        throw new Error(
          "Preview URL was not generated."
        );
      }

      setDocumentPreview({
        ...data.document,
        url: previewUrl,
      });
    } catch (error) {
      console.error(
        "Failed to preview certification document:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to open certification document."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const requestDeleteDocument = (
    certificationId,
    document
  ) => {
    const documentId = getDocumentId(document);

    openConfirmation({
      title: "Delete Document?",
      message: `This will permanently delete "${document.originalName || "this document"}". This action cannot be undone.`,
      confirmText: "Delete Document",
      danger: true,

      onConfirm: async () => {
        try {
          setActionLoading(
            `delete-document-${documentId}`
          );

          const data = await apiRequest(
            `/api/certifications/admin/${certificationId}/documents/${documentId}`,
            {
              method: "DELETE",
            }
          );

          showToast(
            "success",
            data?.message ||
              "Certification document deleted successfully."
          );

          setDocumentPreview(null);

          await loadCertifications();
        } catch (error) {
          console.error(
            "Failed to delete certification document:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to delete certification document."
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const updateDocumentType = async (
    certificationId,
    document,
    nextDocumentType
  ) => {
    const documentId = getDocumentId(document);

    try {
      setActionLoading(
        `document-type-${documentId}`
      );

      const data = await apiRequest(
        `/api/certifications/admin/${certificationId}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentType: nextDocumentType,
          }),
        }
      );

      showToast(
        "success",
        data?.message ||
          "Document type updated successfully."
      );

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to update document type:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to update document type."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const moveDocument = async (
    certification,
    index,
    direction
  ) => {
    const documents = Array.isArray(
      certification.documents
    )
      ? certification.documents
      : [];

    if (
      direction === "up" &&
      index === 0
    ) {
      return;
    }

    if (
      direction === "down" &&
      index === documents.length - 1
    ) {
      return;
    }

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    const reorderedDocuments = [...documents];

    const [currentDocument] =
      reorderedDocuments.splice(index, 1);

    reorderedDocuments.splice(
      targetIndex,
      0,
      currentDocument
    );

    const documentIds = reorderedDocuments
      .map((item) => getDocumentId(item))
      .filter(Boolean);

    const certificationId =
      getCertificationId(certification);

    try {
      setActionLoading(
        `document-reorder-${certificationId}`
      );

      const data = await apiRequest(
        `/api/certifications/admin/${certificationId}/documents/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentIds,
          }),
        }
      );

      showToast(
        "success",
        data?.message ||
          "Document order updated successfully."
      );

      await loadCertifications();
    } catch (error) {
      console.error(
        "Failed to reorder documents:",
        error
      );

      showToast(
        "error",
        error.message ||
          "Failed to reorder documents."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const renderDocuments = (certification) => {
    const certificationId =
      getCertificationId(certification);

    const documents = Array.isArray(
      certification.documents
    )
      ? certification.documents
      : [];

    if (documents.length === 0) {
      return (
        <div
          style={{
            padding: "18px",
            border: "1px dashed #d1d5db",
            borderRadius: "12px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          No documents uploaded yet.
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        {documents.map((document, index) => {
          const documentId =
            getDocumentId(document);

          const previewLoading =
            actionLoading ===
            `preview-${documentId}`;

          return (
            <div
              key={documentId || index}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "14px",
                background: "#fafbfc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {document.originalName ||
                      "Unnamed document"}
                  </strong>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#6b7280",
                      fontSize: "12px",
                    }}
                  >
                    {document.mimeType || "Unknown type"}
                    {" • "}
                    {formatFileSize(document.size)}
                  </div>
                </div>

                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: "999px",
                    background: "#fff7ed",
                    color: "#c2410c",
                    fontSize: "12px",
                    fontWeight: 700,
                    height: "fit-content",
                  }}
                >
                  {getDocumentTypeLabel(
                    document.documentType
                  )}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                <select
                  value={
                    document.documentType ||
                    "certificate"
                  }
                  disabled={
                    actionLoading ===
                    `document-type-${documentId}`
                  }
                  onChange={(event) =>
                    updateDocumentType(
                      certificationId,
                      document,
                      event.target.value
                    )
                  }
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "12px",
                  }}
                >
                  {DOCUMENT_TYPES.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    moveDocument(
                      certification,
                      index,
                      "up"
                    )
                  }
                  disabled={
                    index === 0 ||
                    actionLoading !== null
                  }
                  style={secondaryButtonStyle}
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() =>
                    moveDocument(
                      certification,
                      index,
                      "down"
                    )
                  }
                  disabled={
                    index === documents.length - 1 ||
                    actionLoading !== null
                  }
                  style={secondaryButtonStyle}
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() =>
                    previewDocument(
                      certificationId,
                      document
                    )
                  }
                  disabled={previewLoading}
                  style={secondaryButtonStyle}
                >
                  {previewLoading
                    ? "Opening..."
                    : "Preview"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openReplacePicker(
                      certificationId,
                      document
                    )
                  }
                  disabled={submittingDocument}
                  style={secondaryButtonStyle}
                >
                  Replace
                </button>

                <button
                  type="button"
                  onClick={() =>
                    requestDeleteDocument(
                      certificationId,
                      document
                    )
                  }
                  disabled={
                    actionLoading ===
                    `delete-document-${documentId}`
                  }
                  style={dangerButtonStyle}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px",
        background: "#f5f1eb",
        color: "#211e1c",
      }}
    >
      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={() =>
            (window.location.href = "/admin/dashboard")
          }
          style={{
            ...secondaryButtonStyle,
            marginBottom: "18px",
          }}
        >
          ← Back to Dashboard
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, #ff6f5b, #f49a67)",
                color: "#ffffff",
                fontSize: "23px",
                marginBottom: "12px",
              }}
            >
              ✦
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "34px",
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              Certifications
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#756d66",
              }}
            >
              Manage certificates, documents, visibility,
              featured status, and display order.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={primaryButtonStyle}
          >
            + Add Certification
          </button>
        </div>

        <div
          style={{
            padding: "18px",
            background: "#fffdfa",
            border: "1px solid rgba(42,35,30,0.09)",
            borderRadius: "18px",
            boxShadow:
              "0 10px 30px rgba(42,35,30,0.045)",
            display: "grid",
            gridTemplateColumns:
              "minmax(220px, 2fr) repeat(3, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <input
            type="search"
            placeholder="Search certifications"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            style={inputStyle}
          />

          <select
            value={visibilityFilter}
            onChange={(event) =>
              setVisibilityFilter(event.target.value)
            }
            style={inputStyle}
          >
            <option value="">All Visibility</option>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>

          <select
            value={featuredFilter}
            onChange={(event) =>
              setFeaturedFilter(event.target.value)
            }
            style={inputStyle}
          >
            <option value="">All Featured</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>

          <select
            value={activeFilter}
            onChange={(event) =>
              setActiveFilter(event.target.value)
            }
            style={inputStyle}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div style={emptyStateStyle}>
            Loading certifications...
          </div>
        ) : certifications.length === 0 ? (
          <div style={emptyStateStyle}>
            <h3>No certifications found</h3>
            <p>
              Add your first certification to display it
              here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {certifications.map(
              (certification, index) => {
                const certificationId =
                  getCertificationId(certification);

                const isExpanded =
                  expandedId === certificationId;

                const documents = Array.isArray(
                  certification.documents
                )
                  ? certification.documents
                  : [];

                return (
                  <div
                    key={certificationId || index}
                    style={cardStyle}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginBottom: "9px",
                          }}
                        >
                          <span style={badgeStyle}>
                            #{index + 1}
                          </span>

                          {certification.isFeatured && (
                            <span
                              style={{
                                ...badgeStyle,
                                background: "#fff7ed",
                                color: "#c2410c",
                              }}
                            >
                              Featured
                            </span>
                          )}

                          {certification.isVisible ? (
                            <span
                              style={{
                                ...badgeStyle,
                                background: "#ecfdf5",
                                color: "#047857",
                              }}
                            >
                              Visible
                            </span>
                          ) : (
                            <span
                              style={{
                                ...badgeStyle,
                                background: "#f3f4f6",
                                color: "#6b7280",
                              }}
                            >
                              Hidden
                            </span>
                          )}

                          {certification.isActive ? (
                            <span
                              style={{
                                ...badgeStyle,
                                background: "#ecfdf5",
                                color: "#047857",
                              }}
                            >
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                ...badgeStyle,
                                background: "#fff0ee",
                                color: "#a63d32",
                              }}
                            >
                              Inactive
                            </span>
                          )}
                        </div>

                        <h2
                          style={{
                            margin: 0,
                            fontSize: "21px",
                            fontWeight: 800,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {certification.certificateName}
                        </h2>

                        <p
                          style={{
                            margin: "7px 0 0",
                            color: "#756d66",
                            fontWeight: 600,
                          }}
                        >
                          {certification.issuingOrganization}
                        </p>

                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap",
                            fontSize: "13px",
                            color: "#756d66",
                          }}
                        >
                          <span>
                            Issue:{" "}
                            {formatDate(
                              certification.issueDate
                            )}
                          </span>

                          <span>
                            {certification.doesNotExpire
                              ? "Does not expire"
                              : `Expiry: ${formatDate(
                                  certification.expiryDate
                                )}`}
                          </span>

                          <span>
                            Documents: {documents.length}
                          </span>

                          <span>
                            Order:{" "}
                            {certification.displayOrder ?? 0}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            moveCertification(
                              index,
                              "up"
                            )
                          }
                          disabled={
                            index === 0 ||
                            actionLoading !== null
                          }
                          style={secondaryButtonStyle}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveCertification(
                              index,
                              "down"
                            )
                          }
                          disabled={
                            index ===
                              certifications.length - 1 ||
                            actionLoading !== null
                          }
                          style={secondaryButtonStyle}
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(certification)
                          }
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            requestDeleteCertification(
                              certification
                            )
                          }
                          style={dangerButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginTop: "18px",
                        paddingTop: "16px",
                        borderTop:
                          "1px solid rgba(42,35,30,0.09)",
                      }}
                    >
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            certification.isVisible
                          )}
                          disabled={
                            actionLoading ===
                            `isVisible-${certificationId}`
                          }
                          onChange={(event) =>
                            updateCertificationFlag(
                              certification,
                              "isVisible",
                              event.target.checked
                            )
                          }
                        />
                        Visible
                      </label>

                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            certification.isFeatured
                          )}
                          disabled={
                            actionLoading ===
                            `isFeatured-${certificationId}`
                          }
                          onChange={(event) =>
                            updateCertificationFlag(
                              certification,
                              "isFeatured",
                              event.target.checked
                            )
                          }
                        />
                        Featured
                      </label>

                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            certification.isActive
                          )}
                          disabled={
                            actionLoading ===
                            `isActive-${certificationId}`
                          }
                          onChange={(event) =>
                            updateCertificationFlag(
                              certification,
                              "isActive",
                              event.target.checked
                            )
                          }
                        />
                        Active
                      </label>

                      <label
                        style={{
                          ...checkboxLabelStyle,
                          gap: "7px",
                        }}
                      >
                        Display Order
                        <input
                          type="number"
                          min="0"
                          value={
                            certification.displayOrder ?? 0
                          }
                          disabled={
                            actionLoading ===
                            `order-${certificationId}`
                          }
                          onChange={(event) =>
                            updateDisplayOrder(
                              certification,
                              event.target.value
                            )
                          }
                          style={{
                            width: "76px",
                            padding: "6px",
                            borderRadius: "8px",
                            border:
                              "1px solid #d1d5db",
                          }}
                        />
                      </label>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "16px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openUploadPicker(
                            certificationId
                          )
                        }
                        disabled={submittingDocument}
                        style={primaryButtonStyle}
                      >
                        + Upload Document
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            isExpanded
                              ? null
                              : certificationId
                          )
                        }
                        style={secondaryButtonStyle}
                      >
                        {isExpanded
                          ? "Hide Details"
                          : "View Details"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "18px",
                          paddingTop: "18px",
                          borderTop:
                            "1px solid rgba(42,35,30,0.09)",
                        }}
                      >
                        {certification.description && (
                          <div style={detailBlockStyle}>
                            <h4 style={detailHeadingStyle}>
                              Description
                            </h4>

                            <p style={detailTextStyle}>
                              {certification.description}
                            </p>
                          </div>
                        )}

                        {certification.credentialId && (
                          <div style={detailBlockStyle}>
                            <h4 style={detailHeadingStyle}>
                              Credential ID
                            </h4>

                            <p style={detailTextStyle}>
                              {certification.credentialId}
                            </p>
                          </div>
                        )}

                        {certification.credentialUrl && (
                          <div style={detailBlockStyle}>
                            <h4 style={detailHeadingStyle}>
                              Credential URL
                            </h4>

                            <a
                              href={
                                certification.credentialUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#ff6f5b",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {certification.credentialUrl}
                            </a>
                          </div>
                        )}

                        {certification.skills?.length > 0 && (
                          <div style={detailBlockStyle}>
                            <h4 style={detailHeadingStyle}>
                              Skills
                            </h4>

                            <p style={detailTextStyle}>
                              {arrayToText(
                                certification.skills
                              )}
                            </p>
                          </div>
                        )}

                        {certification.technologies?.length >
                          0 && (
                          <div style={detailBlockStyle}>
                            <h4 style={detailHeadingStyle}>
                              Technologies
                            </h4>

                            <p style={detailTextStyle}>
                              {arrayToText(
                                certification.technologies
                              )}
                            </p>
                          </div>
                        )}

                        <div style={detailBlockStyle}>
                          <h4 style={detailHeadingStyle}>
                            Documents
                          </h4>

                          {renderDocuments(
                            certification
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleDocumentUpload}
        style={{ display: "none" }}
      />

      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleDocumentReplace}
        style={{ display: "none" }}
      />

      {formOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 800,
                }}
              >
                {editingId
                  ? "Edit Certification"
                  : "Add Certification"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                style={secondaryButtonStyle}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={formGridStyle}>
                <label style={fieldLabelStyle}>
                  Certificate Name *
                  <input
                    name="certificateName"
                    value={form.certificateName}
                    onChange={handleFormChange}
                    placeholder="e.g. AWS Cloud Practitioner"
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Issuing Organization *
                  <input
                    name="issuingOrganization"
                    value={form.issuingOrganization}
                    onChange={handleFormChange}
                    placeholder="e.g. Amazon Web Services"
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Credential ID
                  <input
                    name="credentialId"
                    value={form.credentialId}
                    onChange={handleFormChange}
                    placeholder="Optional credential ID"
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Credential URL
                  <input
                    type="url"
                    name="credentialUrl"
                    value={form.credentialUrl}
                    onChange={handleFormChange}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Issue Date *
                  <input
                    type="date"
                    name="issueDate"
                    value={form.issueDate}
                    onChange={handleFormChange}
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Expiry Date
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleFormChange}
                    disabled={form.doesNotExpire}
                    style={inputStyle}
                  />
                </label>

                <label style={fieldLabelStyle}>
                  Display Order
                  <input
                    type="number"
                    name="displayOrder"
                    min="0"
                    value={form.displayOrder}
                    onChange={handleFormChange}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label
                style={{
                  ...checkboxLabelStyle,
                  marginTop: "18px",
                }}
              >
                <input
                  type="checkbox"
                  name="doesNotExpire"
                  checked={form.doesNotExpire}
                  onChange={handleFormChange}
                />
                This certification does not expire
              </label>

              <label
                style={{
                  ...fieldLabelStyle,
                  marginTop: "18px",
                }}
              >
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe the certification..."
                  rows="4"
                  style={textareaStyle}
                />
              </label>

              <label
                style={{
                  ...fieldLabelStyle,
                  marginTop: "18px",
                }}
              >
                Skills
                <input
                  value={arrayToText(form.skills)}
                  onChange={(event) =>
                    handleArrayChange(event, "skills")
                  }
                  placeholder="Java, Problem Solving, Cloud"
                  style={inputStyle}
                />
                <small style={helpTextStyle}>
                  Separate multiple skills with commas.
                </small>
              </label>

              <label
                style={{
                  ...fieldLabelStyle,
                  marginTop: "18px",
                }}
              >
                Technologies
                <input
                  value={arrayToText(form.technologies)}
                  onChange={(event) =>
                    handleArrayChange(
                      event,
                      "technologies"
                    )
                  }
                  placeholder="AWS, EC2, S3"
                  style={inputStyle}
                />
                <small style={helpTextStyle}>
                  Separate multiple technologies with commas.
                </small>
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
              >
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    name="isVisible"
                    checked={form.isVisible}
                    onChange={handleFormChange}
                  />
                  Visible
                </label>

                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={handleFormChange}
                  />
                  Featured
                </label>

                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleFormChange}
                  />
                  Active
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "26px",
                }}
              >
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={primaryButtonStyle}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Certification"
                    : "Create Certification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {documentPreview && (
        <div style={modalOverlayStyle}>
          <div
            style={{
              ...modalStyle,
              maxWidth: "900px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "21px",
                  fontWeight: 800,
                }}
              >
                Document Preview
              </h2>

              <button
                type="button"
                onClick={() =>
                  setDocumentPreview(null)
                }
                style={secondaryButtonStyle}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                color: "#756d66",
                fontSize: "13px",
                overflowWrap: "anywhere",
              }}
            >
              {documentPreview.originalName ||
                "Certification document"}
            </p>

            {isImageMimeType(
              documentPreview.mimeType
            ) ? (
              <img
                src={documentPreview.url}
                alt={
                  documentPreview.originalName ||
                  "Certification document"
                }
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  margin: "0 auto",
                }}
              />
            ) : isPdfMimeType(
                documentPreview.mimeType
              ) ? (
              <iframe
                src={documentPreview.url}
                title="Certification PDF preview"
                style={{
                  width: "100%",
                  height: "70vh",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                }}
              />
            ) : (
              <div style={emptyStateStyle}>
                <p>
                  This document type cannot be previewed
                  directly.
                </p>

                <a
                  href={documentPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#ff6f5b",
                    fontWeight: 700,
                  }}
                >
                  Open Document
                </a>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "18px",
              }}
            >
              <a
                href={documentPreview.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...primaryButtonStyle,
                  textDecoration: "none",
                }}
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div style={modalOverlayStyle}>
          <div
            style={{
              ...modalStyle,
              maxWidth: "480px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 800,
              }}
            >
              {confirmModal.title}
            </h2>

            <p
              style={{
                color: "#756d66",
                lineHeight: 1.7,
                marginTop: "12px",
              }}
            >
              {confirmModal.message}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "22px",
              }}
            >
              <button
                type="button"
                onClick={closeConfirmation}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const callback =
                    confirmModal.onConfirm;

                  setConfirmModal(null);

                  if (typeof callback === "function") {
                    callback();
                  }
                }}
                style={
                  confirmModal.danger
                    ? dangerConfirmButtonStyle
                    : primaryButtonStyle
                }
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "22px",
            right: "22px",
            bottom: "auto",
            zIndex: 1000,
            maxWidth: "min(420px, calc(100vw - 44px))",
            padding: "14px 16px",
            borderRadius: "12px",
            background:
              toast.type === "error"
                ? "#fff0ee"
                : "#eaf7ef",
            border:
              toast.type === "error"
                ? "1px solid #f2c1ba"
                : "1px solid #b7dfc5",
            color:
              toast.type === "error"
                ? "#a63d32"
                : "#287346",
            boxShadow:
              "0 14px 35px rgba(42,35,30,0.14)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <span>{toast.message}</span>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              fontWeight: 800,
              color: "inherit",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

const primaryButtonStyle = {
  border: "1px solid #ff6f5b",
  borderRadius: "12px",
  padding: "11px 16px",
  background:
    "linear-gradient(135deg, #ff6f5b, #f49a67)",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow:
    "0 10px 25px rgba(255,111,91,0.20)",
};

const secondaryButtonStyle = {
  border: "1px solid rgba(42,35,30,0.13)",
  borderRadius: "10px",
  padding: "9px 12px",
  background: "#fffdfa",
  color: "#211e1c",
  fontSize: "12px",
  fontWeight: 800,
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  background: "#fff0ee",
  borderColor: "#f2c1ba",
  color: "#a63d32",
};

const dangerConfirmButtonStyle = {
  ...primaryButtonStyle,
  background: "#a63d32",
  borderColor: "#a63d32",
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "11px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(42,35,30,0.13)",
  background: "#fffdfa",
  color: "#211e1c",
  fontSize: "13px",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.6,
};

const cardStyle = {
  padding: "22px",
  background: "#fffdfa",
  border: "1px solid rgba(42,35,30,0.09)",
  borderRadius: "18px",
  boxShadow:
    "0 10px 30px rgba(42,35,30,0.045)",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "5px 9px",
  background: "#fff0ee",
  color: "#ff6f5b",
  fontSize: "11px",
  fontWeight: 800,
};

const checkboxLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: "#756d66",
  fontSize: "13px",
  fontWeight: 700,
};

const fieldLabelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#211e1c",
  fontSize: "13px",
  fontWeight: 800,
};

const helpTextStyle = {
  color: "#756d66",
  fontSize: "12px",
  fontWeight: 500,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const detailBlockStyle = {
  marginBottom: "18px",
};

const detailHeadingStyle = {
  margin: "0 0 7px",
  fontSize: "13px",
  fontWeight: 800,
  color: "#211e1c",
};

const detailTextStyle = {
  margin: 0,
  color: "#756d66",
  fontSize: "14px",
  lineHeight: 1.7,
  overflowWrap: "anywhere",
};

const emptyStateStyle = {
  padding: "40px 20px",
  textAlign: "center",
  border: "1px dashed rgba(42,35,30,0.18)",
  borderRadius: "16px",
  background: "#fffdfa",
  color: "#756d66",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 900,
  padding: "22px",
  background: "rgba(42,35,30,0.48)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflowY: "auto",
};

const modalStyle = {
  width: "100%",
  maxWidth: "820px",
  maxHeight: "calc(100vh - 44px)",
  overflowY: "auto",
  padding: "26px",
  borderRadius: "20px",
  border: "1px solid rgba(42,35,30,0.09)",
  background: "#fffdfa",
  boxShadow:
    "0 24px 70px rgba(42,35,30,0.20)",
};

export default AdminCertifications;