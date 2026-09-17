import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./AdminEducation.css";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const EDUCATION_LEVELS = [
  {
    value: "class-10",
    label: "Class 10",
  },
  {
    value: "class-12",
    label: "Class 12",
  },
  {
    value: "graduation",
    label: "Graduation",
  },
  {
    value: "post-graduation",
    label: "Post Graduation / MCA",
  },
  {
    value: "diploma",
    label: "Diploma",
  },
  {
    value: "certification",
    label: "Certification",
  },
  {
    value: "other",
    label: "Other",
  },
];

const DOCUMENT_TYPES = [
  {
    value: "marksheet",
    label: "Marksheet",
  },
  {
    value: "certificate",
    label: "Certificate",
  },
  {
    value: "degree",
    label: "Degree",
  },
  {
    value: "transcript",
    label: "Transcript",
  },
  {
    value: "other",
    label: "Other",
  },
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_DOCUMENT_SIZE =
  10 * 1024 * 1024;

/*
|--------------------------------------------------------------------------
| EMPTY FORM
|--------------------------------------------------------------------------
*/

const createEmptyForm = () => ({
  educationLevel: "post-graduation",
  degreeName: "",
  institutionName: "",
  boardOrUniversity: "",
  fieldOfStudy: "",
  location: "",
  startDate: "",
  endDate: "",
  currentlyStudying: false,
  duration: "",
  grade: "",
  percentage: "",
  cgpa: "",
  description: "",
  highlights: [],
  officialVerificationUrl: "",
  isVisible: true,
  isFeatured: false,
  isActive: true,
  displayOrder: 0,
});

/*
|--------------------------------------------------------------------------
| UTILITY FUNCTIONS
|--------------------------------------------------------------------------
*/

const normalizeDateForInput = (
  value
) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
};

const arrayToInput = (
  value
) => {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.join(", ");
};

const normalizeEducationForForm = (
  education
) => {
  if (!education) {
    return createEmptyForm();
  }

  return {
    educationLevel:
      education.educationLevel ||
      "post-graduation",

    degreeName:
      education.degreeName ||
      "",

    institutionName:
      education.institutionName ||
      "",

    boardOrUniversity:
      education.boardOrUniversity ||
      "",

    fieldOfStudy:
      education.fieldOfStudy ||
      "",

    location:
      education.location ||
      "",

    startDate:
      normalizeDateForInput(
        education.startDate
      ),

    endDate:
      normalizeDateForInput(
        education.endDate
      ),

    currentlyStudying:
      Boolean(
        education.currentlyStudying
      ),

    duration:
      education.duration ||
      "",

    grade:
      education.grade ||
      "",

    percentage:
      education.percentage ??
      "",

    cgpa:
      education.cgpa ??
      "",

    description:
      education.description ||
      "",

    highlights:
      Array.isArray(
        education.highlights
      )
        ? education.highlights
        : [],

    officialVerificationUrl:
      education.officialVerificationUrl ||
      "",

    isVisible:
      education.isVisible !==
      undefined
        ? Boolean(
            education.isVisible
          )
        : true,

    isFeatured:
      Boolean(
        education.isFeatured
      ),

    isActive:
      education.isActive !==
      undefined
        ? Boolean(
            education.isActive
          )
        : true,

    displayOrder:
      education.displayOrder ??
      0,
  };
};

const getEducationId = (
  education
) => {
  return (
    education?._id ||
    education?.id ||
    ""
  );
};

const getDocumentId = (
  document
) => {
  return (
    document?._id ||
    document?.id ||
    ""
  );
};

const getDocumentTypeLabel = (
  type
) => {
  const item =
    DOCUMENT_TYPES.find(
      (documentType) =>
        documentType.value ===
        type
    );

  return (
    item?.label ||
    "Other"
  );
};

const formatFileSize = (
  bytes
) => {
  if (
    !bytes ||
    Number(bytes) <= 0
  ) {
    return "Unknown size";
  }

  const size =
    Number(bytes);

  if (
    size <
    1024
  ) {
    return `${size} B`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};

const isImageMimeType = (
  mimeType
) => {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
  ].includes(
    mimeType
  );
};

const isPdfMimeType = (
  mimeType
) => {
  return (
    mimeType ===
    "application/pdf"
  );
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const AdminEducation =
  () => {
    /*
     * ---------------------------------------------------------------
     * STATE
     * ---------------------------------------------------------------
     */

    const [
      educationRecords,
      setEducationRecords,
    ] = useState([]);

    const [
      projects,
      setProjects,
    ] = useState([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      saving,
      setSaving,
    ] = useState(false);

    const [
      documentLoadingId,
      setDocumentLoadingId,
    ] = useState(null);

    const [
      search,
      setSearch,
    ] = useState("");

    const [
      levelFilter,
      setLevelFilter,
    ] = useState("");

    const [
      visibilityFilter,
      setVisibilityFilter,
    ] = useState("");

    const [
      featuredFilter,
      setFeaturedFilter,
    ] = useState("");

    const [
      activeFilter,
      setActiveFilter,
    ] = useState("");

    const [
      form,
      setForm,
    ] = useState(
      createEmptyForm()
    );

    const [
      editingId,
      setEditingId,
    ] = useState(null);

    const [
      formOpen,
      setFormOpen,
    ] = useState(false);

    const [
      expandedId,
      setExpandedId,
    ] = useState(null);

    const [
      toast,
      setToast,
    ] = useState(null);

    const [
      confirmModal,
      setConfirmModal,
    ] = useState(null);

    const [
      uploadTargetId,
      setUploadTargetId,
    ] = useState(null);

    const [
      replaceTarget,
      setReplaceTarget,
    ] = useState(null);

    const [
      documentType,
      setDocumentType,
    ] = useState(
      "marksheet"
    );

    const [
      documentPreview,
      setDocumentPreview,
    ] = useState(null);

    const [
      submittingDocument,
      setSubmittingDocument,
    ] = useState(false);

    const fileInputRef =
      useRef(null);

    const replaceFileInputRef =
      useRef(null);

    const toastTimerRef =
      useRef(null);

    /*
     * ---------------------------------------------------------------
     * LOCAL TOAST
     * ---------------------------------------------------------------
     */

    const showToast =
      useCallback(
        (
          type,
          message
        ) => {
          setToast({
            id:
              Date.now(),
            type,
            message,
          });

          if (
            toastTimerRef.current
          ) {
            clearTimeout(
              toastTimerRef.current
            );
          }

          toastTimerRef.current =
            setTimeout(() => {
              setToast(null);
            }, 3500);
        },
        []
      );

    useEffect(() => {
      return () => {
        if (
          toastTimerRef.current
        ) {
          clearTimeout(
            toastTimerRef.current
          );
        }
      };
    }, []);

    /*
     * ---------------------------------------------------------------
     * API HELPER
     * ---------------------------------------------------------------
     */

    const apiRequest =
      useCallback(
        async (
          endpoint,
          options = {}
        ) => {
          const response =
            await fetch(
              `${API_BASE_URL}${endpoint}`,
              {
                credentials:
                  "include",
                ...options,
              }
            );

          let data = null;

          try {
            data =
              await response.json();
          } catch {
            data = null;
          }

          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            window.location.href =
              "/admin/login";

            throw new Error(
              "Your admin session has expired. Please login again."
            );
          }

          if (
            !response.ok
          ) {
            const error =
              new Error(
                data?.message ||
                  "Something went wrong."
              );

            error.responseData =
              data;

            throw error;
          }

          return data;
        },
        []
      );

    /*
     * ---------------------------------------------------------------
     * LOAD EDUCATION
     * ---------------------------------------------------------------
     */

    const loadEducation =
      useCallback(
        async () => {
          try {
            setLoading(true);

            const query =
              new URLSearchParams();

            query.set(
              "page",
              "1"
            );

            query.set(
              "limit",
              "100"
            );

            if (
              search.trim()
            ) {
              query.set(
                "search",
                search.trim()
              );
            }

            if (
              levelFilter
            ) {
              query.set(
                "educationLevel",
                levelFilter
              );
            }

            if (
              visibilityFilter
            ) {
              query.set(
                "visibility",
                visibilityFilter
              );
            }

            if (
              featuredFilter
            ) {
              query.set(
                "featured",
                featuredFilter
              );
            }

            if (
              activeFilter
            ) {
              query.set(
                "active",
                activeFilter
              );
            }

            const data =
              await apiRequest(
                `/api/admin/education?${query.toString()}`
              );

            setEducationRecords(
              Array.isArray(
                data?.education
              )
                ? data.education
                : []
            );
          } catch (error) {
            console.error(
              "Failed to load education:",
              error
            );

            showToast(
              "error",
              error.message ||
                "Failed to load education records."
            );
          } finally {
            setLoading(false);
          }
        },
        [
          apiRequest,
          search,
          levelFilter,
          visibilityFilter,
          featuredFilter,
          activeFilter,
          showToast,
        ]
      );

    /*
     * ---------------------------------------------------------------
     * LOAD PROJECTS
     * ---------------------------------------------------------------
     */

    const loadProjects =
      useCallback(
        async () => {
          try {
            const data =
              await apiRequest(
                "/api/projects?limit=100"
              );

            setProjects(
              Array.isArray(
                data?.projects
              )
                ? data.projects
                : []
            );
          } catch (error) {
            console.error(
              "Failed to load projects:",
              error
            );

            /*
             * Projects are optional for
             * Education. Do not block the
             * Education CMS if projects fail.
             */
            setProjects([]);
          }
        },
        [apiRequest]
      );

    /*
     * ---------------------------------------------------------------
     * INITIAL LOAD
     * ---------------------------------------------------------------
     */

    useEffect(() => {
      loadEducation();
    }, [
      loadEducation,
    ]);

    useEffect(() => {
      loadProjects();
    }, [
      loadProjects,
    ]);

    /*
     * ---------------------------------------------------------------
     * FORM HELPERS
     * ---------------------------------------------------------------
     */

    const openCreateForm =
      () => {
        setEditingId(null);

        setForm({
          ...createEmptyForm(),
          displayOrder:
            educationRecords.length,
        });

        setFormOpen(true);
      };

    const openEditForm =
      (education) => {
        setEditingId(
          getEducationId(
            education
          )
        );

        setForm(
          normalizeEducationForForm(
            education
          )
        );

        setFormOpen(true);
      };

    const closeForm =
      () => {
        if (saving) {
          return;
        }

        setFormOpen(false);
        setEditingId(null);
        setForm(
          createEmptyForm()
        );
      };

    const handleFormChange =
      (
        event
      ) => {
        const {
          name,
          value,
          type,
          checked,
        } = event.target;

        setForm(
          (
            previous
          ) => ({
            ...previous,
            [name]:
              type ===
              "checkbox"
                ? checked
                : value,
          })
        );
      };

    const handleHighlightsChange =
      (
        event
      ) => {
        const items =
          event.target.value
            .split(
              /\r?\n/
            )
            .map(
              (
                item
              ) =>
                item.trim()
            )
            .filter(
              Boolean
            );

        setForm(
          (
            previous
          ) => ({
            ...previous,
            highlights:
              items,
          })
        );
      };

    /*
     * ---------------------------------------------------------------
     * FORM VALIDATION
     * ---------------------------------------------------------------
     */

    const validateForm =
      () => {
        if (
          !form.educationLevel
        ) {
          showToast(
            "error",
            "Please select an education level."
          );

          return false;
        }

        if (
          !form.degreeName.trim()
        ) {
          showToast(
            "error",
            "Degree / qualification name is required."
          );

          return false;
        }

        if (
          !form.institutionName.trim()
        ) {
          showToast(
            "error",
            "Institution name is required."
          );

          return false;
        }

        if (
          !form.startDate
        ) {
          showToast(
            "error",
            "Start date is required."
          );

          return false;
        }

        if (
          !form.currentlyStudying &&
          form.endDate &&
          new Date(
            form.endDate
          ) <
            new Date(
              form.startDate
            )
        ) {
          showToast(
            "error",
            "End date cannot be before the start date."
          );

          return false;
        }

        if (
          form.percentage !==
            "" &&
          (
            Number(
              form.percentage
            ) <
              0 ||
            Number(
              form.percentage
            ) >
              100
          )
        ) {
          showToast(
            "error",
            "Percentage must be between 0 and 100."
          );

          return false;
        }

        if (
          form.cgpa !==
            "" &&
          Number(
            form.cgpa
          ) <
            0
        ) {
          showToast(
            "error",
            "CGPA cannot be negative."
          );

          return false;
        }

        if (
          form.officialVerificationUrl.trim()
        ) {
          try {
            new URL(
              form.officialVerificationUrl.trim()
            );
          } catch {
            showToast(
              "error",
              "Please enter a valid official verification URL."
            );

            return false;
          }
        }

        return true;
      };

    /*
     * ---------------------------------------------------------------
     * SAVE EDUCATION
     * ---------------------------------------------------------------
     */

    const handleSubmit =
      async (
        event
      ) => {
        event.preventDefault();

        if (
          !validateForm()
        ) {
          return;
        }

        try {
          setSaving(true);

          const payload = {
            educationLevel:
              form.educationLevel,

            degreeName:
              form.degreeName.trim(),

            institutionName:
              form.institutionName.trim(),

            boardOrUniversity:
              form.boardOrUniversity.trim(),

            fieldOfStudy:
              form.fieldOfStudy.trim(),

            location:
              form.location.trim(),

            startDate:
              form.startDate,

            endDate:
              form.currentlyStudying
                ? null
                : form.endDate ||
                  null,

            currentlyStudying:
              Boolean(
                form.currentlyStudying
              ),

            duration:
              form.duration.trim(),

            grade:
              form.grade.trim(),

            percentage:
              form.percentage ===
              ""
                ? null
                : Number(
                    form.percentage
                  ),

            cgpa:
              form.cgpa ===
              ""
                ? null
                : Number(
                    form.cgpa
                  ),

            description:
              form.description.trim(),

            highlights:
              Array.isArray(
                form.highlights
              )
                ? form.highlights
                : [],

            officialVerificationUrl:
              form.officialVerificationUrl.trim(),

            isVisible:
              Boolean(
                form.isVisible
              ),

            isFeatured:
              Boolean(
                form.isFeatured
              ),

            isActive:
              Boolean(
                form.isActive
              ),

            displayOrder:
              Number(
                form.displayOrder
              ) || 0,
          };

          let data;

          if (
            editingId
          ) {
            data =
              await apiRequest(
                `/api/admin/education/${editingId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );
          } else {
            data =
              await apiRequest(
                "/api/admin/education",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );
          }

          showToast(
            "success",
            data?.message ||
              (editingId
                ? "Education updated successfully."
                : "Education created successfully.")
          );

          setFormOpen(
            false
          );

          setEditingId(
            null
          );

          setForm(
            createEmptyForm()
          );

          await loadEducation();
        } catch (error) {
          console.error(
            "Failed to save education:",
            error
          );

          const validationErrors =
            error
              ?.responseData
              ?.validationErrors;

          if (
            validationErrors &&
            typeof validationErrors ===
              "object"
          ) {
            const firstError =
              Object.values(
                validationErrors
              )[0];

            showToast(
              "error",
              Array.isArray(
                firstError
              )
                ? firstError[0]
                : String(
                    firstError
                  )
            );
          } else {
            showToast(
              "error",
              error.message ||
                "Failed to save education."
            );
          }
        } finally {
          setSaving(false);
        }
      };

    /*
     * ---------------------------------------------------------------
     * CONFIRMATION MODAL
     * ---------------------------------------------------------------
     */

    const openConfirmation =
      ({
        title,
        message,
        confirmText =
          "Confirm",
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

    const closeConfirmation =
      () => {
        setConfirmModal(
          null
        );
      };

    useEffect(() => {
      if (
        !confirmModal
      ) {
        return undefined;
      }

      const handleKeyDown =
        (
          event
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            event.preventDefault();

            closeConfirmation();
          }

          if (
            event.key ===
              "Enter" &&
            !event.shiftKey
          ) {
            event.preventDefault();

            const callback =
              confirmModal.onConfirm;

            setConfirmModal(
              null
            );

            if (
              typeof callback ===
              "function"
            ) {
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
    }, [
      confirmModal,
    ]);

    /*
     * ---------------------------------------------------------------
     * DELETE EDUCATION
     * ---------------------------------------------------------------
     */

    const requestDeleteEducation =
      (
        education
      ) => {
        const educationId =
          getEducationId(
            education
          );

        openConfirmation({
          title:
            "Delete Education?",
          message: `This will permanently delete "${education.degreeName}" and all documents attached to this education record. This action cannot be undone.`,
          confirmText:
            "Delete Education",
          danger: true,
          onConfirm:
            async () => {
              try {
                setSaving(
                  true
                );

                const data =
                  await apiRequest(
                    `/api/admin/education/${educationId}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                showToast(
                  "success",
                  data?.message ||
                    "Education deleted successfully."
                );

                await loadEducation();
              } catch (
                error
              ) {
                console.error(
                  "Failed to delete education:",
                  error
                );

                showToast(
                  "error",
                  error.message ||
                    "Failed to delete education."
                );
              } finally {
                setSaving(
                  false
                );
              }
            },
        });
      };

    /*
     * ---------------------------------------------------------------
     * GENERIC STATUS UPDATE
     * ---------------------------------------------------------------
     */

    const updateEducationFlag =
      async (
        education,
        field,
        value
      ) => {
        const educationId =
          getEducationId(
            education
          );

        const endpointMap = {
          isVisible:
            "visibility",
          isFeatured:
            "featured",
          isActive:
            "active",
        };

        const endpoint =
          endpointMap[
            field
          ];

        if (!endpoint) {
          return;
        }

        try {
          setDocumentLoadingId(
            `${field}-${educationId}`
          );

          const data =
            await apiRequest(
              `/api/admin/education/${educationId}/${endpoint}`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    [field]:
                      Boolean(
                        value
                      ),
                  }),
              }
            );

          showToast(
            "success",
            data?.message ||
              "Education status updated successfully."
          );

          await loadEducation();
        } catch (
          error
        ) {
          console.error(
            "Failed to update education flag:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to update education status."
          );
        } finally {
          setDocumentLoadingId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * UPDATE DISPLAY ORDER
     * ---------------------------------------------------------------
     */

    const updateEducationOrder =
      async (
        education,
        nextOrder
      ) => {
        const educationId =
          getEducationId(
            education
          );

        try {
          setDocumentLoadingId(
            `order-${educationId}`
          );

          const data =
            await apiRequest(
              `/api/admin/education/${educationId}/order`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    displayOrder:
                      Number(
                        nextOrder
                      ) || 0,
                  }),
              }
            );

          showToast(
            "success",
            data?.message ||
              "Education order updated successfully."
          );

          await loadEducation();
        } catch (
          error
        ) {
          console.error(
            "Failed to update education order:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to update education order."
          );
        } finally {
          setDocumentLoadingId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * MOVE EDUCATION UP / DOWN
     * ---------------------------------------------------------------
     */

    const moveEducation =
      async (
        index,
        direction
      ) => {
        if (
          direction ===
            "up" &&
          index === 0
        ) {
          return;
        }

        if (
          direction ===
            "down" &&
          index ===
            educationRecords.length -
              1
        ) {
          return;
        }

        const targetIndex =
          direction ===
          "up"
            ? index - 1
            : index + 1;

        const current =
          educationRecords[
            index
          ];

        const target =
          educationRecords[
            targetIndex
          ];

        const currentId =
          getEducationId(
            current
          );

        const targetId =
          getEducationId(
            target
          );

        try {
          setDocumentLoadingId(
            `move-${currentId}`
          );

          await Promise.all([
            apiRequest(
              `/api/admin/education/${currentId}/order`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    displayOrder:
                      Number(
                        target.displayOrder
                      ) || targetIndex,
                  }),
              }
            ),

            apiRequest(
              `/api/admin/education/${targetId}/order`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    displayOrder:
                      Number(
                        current.displayOrder
                      ) || index,
                  }),
              }
            ),
          ]);

          showToast(
            "success",
            "Education order updated successfully."
          );

          await loadEducation();
        } catch (
          error
        ) {
          console.error(
            "Failed to reorder education:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to reorder education."
          );
        } finally {
          setDocumentLoadingId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * DOCUMENT FILE VALIDATION
     * ---------------------------------------------------------------
     */

    const validateDocumentFile =
      (
        file
      ) => {
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

        if (
          file.size >
          MAX_DOCUMENT_SIZE
        ) {
          showToast(
            "error",
            "Education document must be 10 MB or smaller."
          );

          return false;
        }

        return true;
      };

    /*
     * ---------------------------------------------------------------
     * OPEN UPLOAD PICKER
     * ---------------------------------------------------------------
     */

    const openUploadPicker =
      (
        educationId
      ) => {
        setUploadTargetId(
          educationId
        );

        setDocumentType(
          "marksheet"
        );

        setTimeout(() => {
          fileInputRef.current?.click();
        }, 0);
      };

    /*
     * ---------------------------------------------------------------
     * UPLOAD DOCUMENT
     * ---------------------------------------------------------------
     */

    const handleDocumentUpload =
      async (
        event
      ) => {
        const file =
          event.target.files?.[0];

        event.target.value =
          "";

        if (
          !uploadTargetId
        ) {
          return;
        }

        if (
          !validateDocumentFile(
            file
          )
        ) {
          return;
        }

        try {
          setSubmittingDocument(
            true
          );

          const formData =
            new FormData();

          formData.append(
            "document",
            file
          );

          formData.append(
            "documentType",
            documentType
          );

          const data =
            await apiRequest(
              `/api/admin/education/${uploadTargetId}/documents`,
              {
                method:
                  "POST",
                body:
                  formData,
              }
            );

          showToast(
            "success",
            data?.message ||
              "Education document uploaded successfully."
          );

          setUploadTargetId(
            null
          );

          setDocumentType(
            "marksheet"
          );

          await loadEducation();
        } catch (
          error
        ) {
          console.error(
            "Failed to upload education document:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to upload education document."
          );
        } finally {
          setSubmittingDocument(
            false
          );
          setUploadTargetId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * OPEN REPLACE PICKER
     * ---------------------------------------------------------------
     */

    const openReplacePicker =
      (
        educationId,
        document
      ) => {
        setReplaceTarget({
          educationId,
          documentId:
            getDocumentId(
              document
            ),
          documentType:
            document.documentType ||
            "marksheet",
        });

        setTimeout(() => {
          replaceFileInputRef.current?.click();
        }, 0);
      };

    /*
     * ---------------------------------------------------------------
     * REPLACE DOCUMENT
     * ---------------------------------------------------------------
     */

    const handleDocumentReplace =
      async (
        event
      ) => {
        const file =
          event.target.files?.[0];

        event.target.value =
          "";

        if (
          !replaceTarget
        ) {
          return;
        }

        if (
          !validateDocumentFile(
            file
          )
        ) {
          return;
        }

        try {
          setSubmittingDocument(
            true
          );

          const formData =
            new FormData();

          formData.append(
            "document",
            file
          );

          formData.append(
            "documentType",
            replaceTarget.documentType ||
              "marksheet"
          );

          const data =
            await apiRequest(
              `/api/admin/education/${replaceTarget.educationId}/documents/${replaceTarget.documentId}`,
              {
                method:
                  "PUT",
                body:
                  formData,
              }
            );

          showToast(
            "success",
            data?.message ||
              "Education document replaced successfully."
          );

          setReplaceTarget(
            null
          );

          await loadEducation();
        } catch (
          error
        ) {
          console.error(
            "Failed to replace education document:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to replace education document."
          );
        } finally {
          setSubmittingDocument(
            false
          );
          setReplaceTarget(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * PREVIEW DOCUMENT
     * ---------------------------------------------------------------
     */

    const previewDocument =
      async (
        educationId,
        document
      ) => {
        const documentId =
          getDocumentId(
            document
          );

        if (
          !educationId ||
          !documentId
        ) {
          showToast(
            "error",
            "Document information is incomplete."
          );

          return;
        }

        try {
          setDocumentLoadingId(
            `preview-${documentId}`
          );

          const data =
            await apiRequest(
              `/api/admin/education/${educationId}/documents/${documentId}`
            );

          const previewUrl =
            data?.document?.url;

          if (
            !previewUrl
          ) {
            throw new Error(
              "Preview URL was not generated."
            );
          }

          setDocumentPreview({
            ...data.document,
            url:
              previewUrl,
          });
        } catch (
          error
        ) {
          console.error(
            "Failed to preview education document:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to open education document."
          );
        } finally {
          setDocumentLoadingId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * DELETE DOCUMENT
     * ---------------------------------------------------------------
     */

    const requestDeleteDocument =
      (
        education,
        document
      ) => {
        const educationId =
          getEducationId(
            education
          );

        const documentId =
          getDocumentId(
            document
          );

        openConfirmation({
          title:
            "Delete Document?",
          message: `This will permanently delete "${document.originalName || "this document"}" from this education record and Cloudinary.`,
          confirmText:
            "Delete Document",
          danger: true,
          onConfirm:
            async () => {
              try {
                setDocumentLoadingId(
                  `delete-${documentId}`
                );

                const data =
                  await apiRequest(
                    `/api/admin/education/${educationId}/documents/${documentId}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                showToast(
                  "success",
                  data?.message ||
                    "Education document deleted successfully."
                );

                await loadEducation();
              } catch (
                error
              ) {
                console.error(
                  "Failed to delete education document:",
                  error
                );

                showToast(
                  "error",
                  error.message ||
                    "Failed to delete education document."
                );
              } finally {
                setDocumentLoadingId(
                  null
                );
              }
            },
        });
      };

    /*
     * ---------------------------------------------------------------
     * UPDATE DOCUMENT TYPE
     * ---------------------------------------------------------------
     */

    const updateDocumentType =
      async (
        educationId,
        documentId,
        nextType
      ) => {
        try {
          setDocumentLoadingId(
            `type-${documentId}`
          );

          const data =
            await apiRequest(
              `/api/admin/education/${educationId}/documents/${documentId}`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    documentType:
                      nextType,
                  }),
              }
            );

          showToast(
            "success",
            data?.message ||
              "Document type updated successfully."
          );

          await loadEducation();
        } catch (
          error
        ) {
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
          setDocumentLoadingId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * UPDATE DOCUMENT ORDER
     * ---------------------------------------------------------------
     */

    const updateDocumentOrder =
      async (
        education,
        document,
        nextOrder
      ) => {
        const educationId =
          getEducationId(
            education
          );

        const documentId =
          getDocumentId(
            document
          );

        try {
          setDocumentLoadingId(
            `doc-order-${documentId}`
          );

          const data =
            await apiRequest(
              `/api/admin/education/${educationId}/documents/${documentId}`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    displayOrder:
                      Number(
                        nextOrder
                      ) || 0,
                  }),
              }
            );

          showToast(
            "success",
            data?.message ||
              "Document order updated successfully."
          );

          await loadEducation();
        } catch (
          error
        ) {
          console.error(
            "Failed to update document order:",
            error
          );

          showToast(
            "error",
            error.message ||
              "Failed to update document order."
          );
        } finally {
          setDocumentLoadingId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * DOCUMENT MOVE
     * ---------------------------------------------------------------
     */

    const moveDocument =
      async (
        education,
        index,
        direction
      ) => {
        const documents =
          Array.isArray(
            education.documents
          )
            ? [
                ...education.documents,
              ].sort(
                (
                  a,
                  b
                ) =>
                  (
                    Number(
                      a.displayOrder
                    ) || 0
                  ) -
                  (
                    Number(
                      b.displayOrder
                    ) || 0
                  )
              )
            : [];

        if (
          direction ===
            "up" &&
          index === 0
        ) {
          return;
        }

        if (
          direction ===
            "down" &&
          index ===
            documents.length -
              1
        ) {
          return;
        }

        const targetIndex =
          direction ===
          "up"
            ? index - 1
            : index + 1;

        const current =
          documents[index];

        const target =
          documents[
            targetIndex
          ];

        const currentId =
          getDocumentId(
            current
          );

        const targetId =
          getDocumentId(
            target
          );

        try {
          setDocumentLoadingId(
            `move-document-${currentId}`
          );

          await Promise.all([
            apiRequest(
              `/api/admin/education/${getEducationId(
                education
              )}/documents/${currentId}`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    displayOrder:
                      Number(
                        target.displayOrder
                      ) ||
                      targetIndex,
                  }),
              }
            ),

            apiRequest(
              `/api/admin/education/${getEducationId(
                education
              )}/documents/${targetId}`,
              {
                method:
                  "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    displayOrder:
                      Number(
                        current.displayOrder
                      ) ||
                      index,
                  }),
              }
            ),
          ]);

          showToast(
            "success",
            "Document order updated successfully."
          );

          await loadEducation();
        } catch (
          error
        ) {
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
          setDocumentLoadingId(
            null
          );
        }
      };

    /*
     * ---------------------------------------------------------------
     * SORTED / FILTERED RECORDS
     * ---------------------------------------------------------------
     */

    const displayedEducation =
      useMemo(() => {
        return [
          ...educationRecords,
        ].sort(
          (
            a,
            b
          ) =>
            (
              Number(
                a.displayOrder
              ) || 0
            ) -
            (
              Number(
                b.displayOrder
              ) || 0
            )
        );
      }, [
        educationRecords,
      ]);

    /*
     * ---------------------------------------------------------------
     * EDUCATION LEVEL LABEL
     * ---------------------------------------------------------------
     */

    const getLevelLabel =
      (
        level
      ) => {
        return (
          EDUCATION_LEVELS.find(
            (
              item
            ) =>
              item.value ===
              level
          )?.label ||
          level ||
          "Education"
        );
      };

    /*
     * ---------------------------------------------------------------
     * RENDER
     * ---------------------------------------------------------------
     */

    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "#f6f7fb",
          color:
            "#151821",
          padding:
            "32px",
          boxSizing:
            "border-box",
        }}
      >
        {/*
         |--------------------------------------------------------------------------
         | LOCAL TOAST
         |--------------------------------------------------------------------------
         */}

        {toast && (
          <div
            style={{
              position:
                "fixed",
              top:
                "24px",
              right:
                "24px",
              zIndex:
                2000,
              minWidth:
                "280px",
              maxWidth:
                "420px",
              padding:
                "14px 16px",
              borderRadius:
                "14px",
              background:
                toast.type ===
                "success"
                  ? "#ecfdf3"
                  : "#fff1f2",
              border:
                toast.type ===
                "success"
                  ? "1px solid #bbf7d0"
                  : "1px solid #fecdd3",
              boxShadow:
                "0 18px 45px rgba(15,23,42,0.14)",
              display:
                "flex",
              alignItems:
                "flex-start",
              gap:
                "10px",
            }}
          >
            <span
              style={{
                fontSize:
                  "18px",
                lineHeight:
                  1,
              }}
            >
              {toast.type ===
              "success"
                ? "✅"
                : "⚠️"}
            </span>

            <div
              style={{
                fontSize:
                  "14px",
                fontWeight:
                  600,
                lineHeight:
                  1.5,
              }}
            >
              {toast.message}
            </div>
          </div>
        )}

        {/*
         |--------------------------------------------------------------------------
         | PAGE HEADER
         |--------------------------------------------------------------------------
         */}

        <div
          style={{
            maxWidth:
              "1400px",
            margin:
              "0 auto 28px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap:
                "20px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/dashboard";
                }}
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  padding:
                    0,
                  marginBottom:
                    "12px",
                  color:
                    "#64748b",
                  fontSize:
                    "14px",
                  fontWeight:
                    700,
                  cursor:
                    "pointer",
                }}
              >
                ← Back to Dashboard
              </button>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "12px",
                  marginBottom:
                    "8px",
                }}
              >
                <div
                  style={{
                    width:
                      "46px",
                    height:
                      "46px",
                    borderRadius:
                      "14px",
                    background:
                      "#111827",
                    color:
                      "#ffffff",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    fontSize:
                      "22px",
                  }}
                >
                  🎓
                </div>

                <div>
                  <h1
                    style={{
                      margin:
                        0,
                      fontSize:
                        "30px",
                      lineHeight:
                        1.15,
                      letterSpacing:
                        "-0.8px",
                    }}
                  >
                    Education
                  </h1>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#64748b",
                      fontSize:
                        "14px",
                    }}
                  >
                    Manage academic qualifications,
                    documents and verification details.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                openCreateForm
              }
              style={{
                border:
                  "none",
                borderRadius:
                  "13px",
                background:
                  "#111827",
                color:
                  "#ffffff",
                padding:
                  "12px 18px",
                fontSize:
                  "14px",
                fontWeight:
                  800,
                cursor:
                  "pointer",
                boxShadow:
                  "0 12px 28px rgba(15,23,42,0.16)",
              }}
            >
              ＋ Add Education
            </button>
          </div>
        </div>

        {/*
         |--------------------------------------------------------------------------
         | FILTER BAR
         |--------------------------------------------------------------------------
         */}

        <div
          style={{
            maxWidth:
              "1400px",
            margin:
              "0 auto 24px",
            background:
              "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius:
              "18px",
            padding:
              "18px",
            boxShadow:
              "0 8px 30px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "minmax(220px, 1.6fr) repeat(4, minmax(140px, 1fr))",
              gap:
                "12px",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="🔎 Search education..."
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                border:
                  "1px solid #dbe1ea",
                borderRadius:
                  "11px",
                padding:
                  "11px 13px",
                outline:
                  "none",
                fontSize:
                  "14px",
              }}
            />

            <select
              value={
                levelFilter
              }
              onChange={(
                event
              ) =>
                setLevelFilter(
                  event.target.value
                )
              }
              style={{
                border:
                  "1px solid #dbe1ea",
                borderRadius:
                  "11px",
                padding:
                  "11px 13px",
                fontSize:
                  "14px",
                background:
                  "#ffffff",
              }}
            >
              <option value="">
                All Levels
              </option>

              {EDUCATION_LEVELS.map(
                (
                  level
                ) => (
                  <option
                    key={
                      level.value
                    }
                    value={
                      level.value
                    }
                  >
                    {
                      level.label
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={
                visibilityFilter
              }
              onChange={(
                event
              ) =>
                setVisibilityFilter(
                  event.target.value
                )
              }
              style={{
                border:
                  "1px solid #dbe1ea",
                borderRadius:
                  "11px",
                padding:
                  "11px 13px",
                fontSize:
                  "14px",
                background:
                  "#ffffff",
              }}
            >
              <option value="">
                Visibility
              </option>
              <option value="true">
                Visible
              </option>
              <option value="false">
                Hidden
              </option>
            </select>

            <select
              value={
                featuredFilter
              }
              onChange={(
                event
              ) =>
                setFeaturedFilter(
                  event.target.value
                )
              }
              style={{
                border:
                  "1px solid #dbe1ea",
                borderRadius:
                  "11px",
                padding:
                  "11px 13px",
                fontSize:
                  "14px",
                background:
                  "#ffffff",
              }}
            >
              <option value="">
                Featured
              </option>
              <option value="true">
                Featured
              </option>
              <option value="false">
                Not Featured
              </option>
            </select>

            <select
              value={
                activeFilter
              }
              onChange={(
                event
              ) =>
                setActiveFilter(
                  event.target.value
                )
              }
              style={{
                border:
                  "1px solid #dbe1ea",
                borderRadius:
                  "11px",
                padding:
                  "11px 13px",
                fontSize:
                  "14px",
                background:
                  "#ffffff",
              }}
            >
              <option value="">
                Active Status
              </option>
              <option value="true">
                Active
              </option>
              <option value="false">
                Inactive
              </option>
            </select>
          </div>
        </div>

        {/*
         |--------------------------------------------------------------------------
         | CONTENT
         |--------------------------------------------------------------------------
         */}

        <div
          style={{
            maxWidth:
              "1400px",
            margin:
              "0 auto",
          }}
        >
          {loading ? (
            <div
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "18px",
                padding:
                  "60px 20px",
                textAlign:
                  "center",
                color:
                  "#64748b",
              }}
            >
              <div
                style={{
                  fontSize:
                    "30px",
                  marginBottom:
                    "12px",
                }}
              >
                ⏳
              </div>

              Loading education records...
            </div>
          ) : displayedEducation.length ===
            0 ? (
            <div
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "18px",
                padding:
                  "70px 20px",
                textAlign:
                  "center",
                boxShadow:
                  "0 8px 30px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "48px",
                  marginBottom:
                    "12px",
                }}
              >
                🎓
              </div>

              <h3
                style={{
                  margin:
                    "0 0 8px",
                  fontSize:
                    "20px",
                }}
              >
                No education records found
              </h3>

              <p
                style={{
                  margin:
                    "0 auto 20px",
                  maxWidth:
                    "520px",
                  color:
                    "#64748b",
                  fontSize:
                    "14px",
                  lineHeight:
                    1.6,
                }}
              >
                Add your Class 10, Class 12,
                Graduation, MCA or other academic
                qualifications.
              </p>

              <button
                type="button"
                onClick={
                  openCreateForm
                }
                style={{
                  border:
                    "none",
                  borderRadius:
                    "11px",
                  background:
                    "#111827",
                  color:
                    "#ffffff",
                  padding:
                    "11px 16px",
                  fontWeight:
                    800,
                  cursor:
                    "pointer",
                }}
              >
                ＋ Add First Education
              </button>
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap:
                  "16px",
              }}
            >
              {displayedEducation.map(
                (
                  education,
                  index
                ) => {
                  const educationId =
                    getEducationId(
                      education
                    );

                  const documents =
                    Array.isArray(
                      education.documents
                    )
                      ? [
                          ...education.documents,
                        ].sort(
                          (
                            a,
                            b
                          ) =>
                            (
                              Number(
                                a.displayOrder
                              ) || 0
                            ) -
                            (
                              Number(
                                b.displayOrder
                              ) || 0
                            )
                        )
                      : [];

                  const isExpanded =
                    expandedId ===
                    educationId;

                  return (
                    <div
                      key={
                        educationId
                      }
                      style={{
                        background:
                          "#ffffff",
                        border:
                          "1px solid #e5e7eb",
                        borderRadius:
                          "18px",
                        overflow:
                          "hidden",
                        boxShadow:
                          "0 8px 30px rgba(15,23,42,0.045)",
                      }}
                    >
                      {/*
                       * --------------------------------------------------
                       * CARD HEADER
                       * --------------------------------------------------
                       */}

                      <div
                        style={{
                          padding:
                            "20px",
                          display:
                            "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
                          gap:
                            "18px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "14px",
                            minWidth:
                              0,
                            flex:
                              "1 1 500px",
                          }}
                        >
                          <div
                            style={{
                              width:
                                "48px",
                              height:
                                "48px",
                              flexShrink:
                                0,
                              borderRadius:
                                "14px",
                              background:
                                "#f1f5f9",
                              display:
                                "grid",
                              placeItems:
                                "center",
                              fontSize:
                                "23px",
                            }}
                          >
                            🎓
                          </div>

                          <div
                            style={{
                              minWidth:
                                0,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap:
                                  "8px",
                                flexWrap:
                                  "wrap",
                                marginBottom:
                                  "6px",
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  borderRadius:
                                    "999px",
                                  padding:
                                    "5px 9px",
                                  background:
                                    "#eef2ff",
                                  color:
                                    "#4338ca",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    800,
                                  textTransform:
                                    "uppercase",
                                  letterSpacing:
                                    "0.4px",
                                }}
                              >
                                {
                                  getLevelLabel(
                                    education.educationLevel
                                  )
                                }
                              </span>

                              {education.currentlyStudying && (
                                <span
                                  style={{
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    borderRadius:
                                      "999px",
                                    padding:
                                      "5px 9px",
                                    background:
                                      "#ecfdf5",
                                    color:
                                      "#047857",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  🟢 Ongoing
                                </span>
                              )}

                              {education.isFeatured && (
                                <span
                                  style={{
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    borderRadius:
                                      "999px",
                                    padding:
                                      "5px 9px",
                                    background:
                                      "#fff7ed",
                                    color:
                                      "#c2410c",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  ⭐ Featured
                                </span>
                              )}
                            </div>

                            <h2
                              style={{
                                margin:
                                  0,
                                fontSize:
                                  "20px",
                                lineHeight:
                                  1.3,
                                letterSpacing:
                                  "-0.3px",
                              }}
                            >
                              {
                                education.degreeName
                              }
                            </h2>

                            <p
                              style={{
                                margin:
                                  "5px 0 0",
                                color:
                                  "#475569",
                                fontSize:
                                  "14px",
                                fontWeight:
                                  650,
                              }}
                            >
                              {
                                education.institutionName
                              }
                            </p>

                            {education.fieldOfStudy && (
                              <p
                                style={{
                                  margin:
                                    "4px 0 0",
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "13px",
                                }}
                              >
                                {
                                  education.fieldOfStudy
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "7px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            type="button"
                            title="Move up"
                            disabled={
                              index ===
                                0 ||
                              documentLoadingId
                            }
                            onClick={() =>
                              moveEducation(
                                index,
                                "up"
                              )
                            }
                            style={{
                              width:
                                "34px",
                              height:
                                "34px",
                              border:
                                "1px solid #e2e8f0",
                              background:
                                "#ffffff",
                              borderRadius:
                                "9px",
                              cursor:
                                "pointer",
                            }}
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            title="Move down"
                            disabled={
                              index ===
                                displayedEducation.length -
                                  1 ||
                              documentLoadingId
                            }
                            onClick={() =>
                              moveEducation(
                                index,
                                "down"
                              )
                            }
                            style={{
                              width:
                                "34px",
                              height:
                                "34px",
                              border:
                                "1px solid #e2e8f0",
                              background:
                                "#ffffff",
                              borderRadius:
                                "9px",
                              cursor:
                                "pointer",
                            }}
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                education
                              )
                            }
                            style={{
                              border:
                                "1px solid #dbe1ea",
                              background:
                                "#ffffff",
                              color:
                                "#334155",
                              borderRadius:
                                "9px",
                              padding:
                                "8px 11px",
                              fontSize:
                                "13px",
                              fontWeight:
                                750,
                              cursor:
                                "pointer",
                            }}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              requestDeleteEducation(
                                education
                              )
                            }
                            style={{
                              border:
                                "1px solid #fecdd3",
                              background:
                                "#fff1f2",
                              color:
                                "#be123c",
                              borderRadius:
                                "9px",
                              padding:
                                "8px 11px",
                              fontSize:
                                "13px",
                              fontWeight:
                                750,
                              cursor:
                                "pointer",
                            }}
                          >
                            🗑️ Delete
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(
                                isExpanded
                                  ? null
                                  : educationId
                              )
                            }
                            style={{
                              border:
                                "none",
                              background:
                                "#111827",
                              color:
                                "#ffffff",
                              borderRadius:
                                "9px",
                              padding:
                                "8px 12px",
                              fontSize:
                                "13px",
                              fontWeight:
                                750,
                              cursor:
                                "pointer",
                            }}
                          >
                            {isExpanded
                              ? "Hide Details"
                              : "Manage Details"}
                          </button>
                        </div>
                      </div>

                      {/*
                       * --------------------------------------------------
                       * QUICK INFO
                       * --------------------------------------------------
                       */}

                      <div
                        style={{
                          padding:
                            "0 20px 18px",
                          display:
                            "flex",
                          gap:
                            "8px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding:
                              "7px 10px",
                            borderRadius:
                              "9px",
                            background:
                              "#f8fafc",
                            color:
                              "#475569",
                            fontSize:
                              "12px",
                            fontWeight:
                              650,
                          }}
                        >
                          📅{" "}
                          {normalizeDateForInput(
                            education.startDate
                          ) ||
                            "Start date"}
                          {" — "}
                          {education.currentlyStudying
                            ? "Present"
                            : normalizeDateForInput(
                                education.endDate
                              ) ||
                              "End date"}
                        </span>

                        {education.location && (
                          <span
                            style={{
                              padding:
                                "7px 10px",
                              borderRadius:
                                "9px",
                              background:
                                "#f8fafc",
                              color:
                                "#475569",
                              fontSize:
                                "12px",
                              fontWeight:
                                650,
                            }}
                          >
                            📍{" "}
                            {
                              education.location
                            }
                          </span>
                        )}

                        {education.grade && (
                          <span
                            style={{
                              padding:
                                "7px 10px",
                              borderRadius:
                                "9px",
                              background:
                                "#f8fafc",
                              color:
                                "#475569",
                              fontSize:
                                "12px",
                              fontWeight:
                                650,
                            }}
                          >
                            🏅 Grade:{" "}
                            {
                              education.grade
                            }
                          </span>
                        )}

                        {education.percentage !==
                          null &&
                          education.percentage !==
                            undefined &&
                          education.percentage !==
                            "" && (
                            <span
                              style={{
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "9px",
                                background:
                                  "#f8fafc",
                                color:
                                  "#475569",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  650,
                              }}
                            >
                              📊{" "}
                              {
                                education.percentage
                              }
                              %
                            </span>
                          )}

                        {education.cgpa !==
                          null &&
                          education.cgpa !==
                            undefined &&
                          education.cgpa !==
                            "" && (
                            <span
                              style={{
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "9px",
                                background:
                                  "#f8fafc",
                                color:
                                  "#475569",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  650,
                              }}
                            >
                              ⭐ CGPA:{" "}
                              {
                                education.cgpa
                              }
                            </span>
                          )}

                        <span
                          style={{
                            padding:
                              "7px 10px",
                            borderRadius:
                              "9px",
                            background:
                              education.isVisible
                                ? "#ecfdf5"
                                : "#f1f5f9",
                            color:
                              education.isVisible
                                ? "#047857"
                                : "#64748b",
                            fontSize:
                              "12px",
                            fontWeight:
                              750,
                          }}
                        >
                          {education.isVisible
                            ? "👁️ Public"
                            : "🙈 Hidden"}
                        </span>

                        <span
                          style={{
                            padding:
                              "7px 10px",
                            borderRadius:
                              "9px",
                            background:
                              education.isActive
                                ? "#eff6ff"
                                : "#f1f5f9",
                            color:
                              education.isActive
                                ? "#1d4ed8"
                                : "#64748b",
                            fontSize:
                              "12px",
                            fontWeight:
                              750,
                          }}
                        >
                          {education.isActive
                            ? "● Active"
                            : "○ Inactive"}
                        </span>
                      </div>

                      {/*
                       * --------------------------------------------------
                       * EXPANDED DETAILS
                       * --------------------------------------------------
                       */}

                      {isExpanded && (
                        <div
                          style={{
                            borderTop:
                              "1px solid #eef2f7",
                            padding:
                              "22px 20px 24px",
                            background:
                              "#fafbfc",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "minmax(0, 1.5fr) minmax(300px, 1fr)",
                              gap:
                                "20px",
                            }}
                          >
                            {/*
                             * ------------------------------------------
                             * LEFT DETAILS
                             * ------------------------------------------
                             */}

                            <div
                              style={{
                                display:
                                  "grid",
                                gap:
                                  "16px",
                              }}
                            >
                              {education.boardOrUniversity && (
                                <div
                                  style={{
                                    background:
                                      "#ffffff",
                                    border:
                                      "1px solid #e5e7eb",
                                    borderRadius:
                                      "13px",
                                    padding:
                                      "15px",
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        "#94a3b8",
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        800,
                                      textTransform:
                                        "uppercase",
                                      letterSpacing:
                                        "0.5px",
                                      marginBottom:
                                        "5px",
                                    }}
                                  >
                                    Board / University
                                  </div>

                                  <div
                                    style={{
                                      fontSize:
                                        "14px",
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {
                                      education.boardOrUniversity
                                    }
                                  </div>
                                </div>
                              )}

                              {education.duration && (
                                <div
                                  style={{
                                    background:
                                      "#ffffff",
                                    border:
                                      "1px solid #e5e7eb",
                                    borderRadius:
                                      "13px",
                                    padding:
                                      "15px",
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        "#94a3b8",
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        800,
                                      textTransform:
                                        "uppercase",
                                      letterSpacing:
                                        "0.5px",
                                      marginBottom:
                                        "5px",
                                    }}
                                  >
                                    Duration
                                  </div>

                                  <div
                                    style={{
                                      fontSize:
                                        "14px",
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {
                                      education.duration
                                    }
                                  </div>
                                </div>
                              )}

                              {education.description && (
                                <div
                                  style={{
                                    background:
                                      "#ffffff",
                                    border:
                                      "1px solid #e5e7eb",
                                    borderRadius:
                                      "13px",
                                    padding:
                                      "15px",
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        "#94a3b8",
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        800,
                                      textTransform:
                                        "uppercase",
                                      letterSpacing:
                                        "0.5px",
                                      marginBottom:
                                        "7px",
                                    }}
                                  >
                                    Description
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        "#475569",
                                      fontSize:
                                        "14px",
                                      lineHeight:
                                        1.7,
                                      whiteSpace:
                                        "pre-wrap",
                                    }}
                                  >
                                    {
                                      education.description
                                    }
                                  </div>
                                </div>
                              )}

                              {Array.isArray(
                                education.highlights
                              ) &&
                                education
                                  .highlights
                                  .length >
                                  0 && (
                                  <div
                                    style={{
                                      background:
                                        "#ffffff",
                                      border:
                                        "1px solid #e5e7eb",
                                      borderRadius:
                                        "13px",
                                      padding:
                                        "15px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        color:
                                          "#94a3b8",
                                        fontSize:
                                          "11px",
                                        fontWeight:
                                          800,
                                        textTransform:
                                          "uppercase",
                                        letterSpacing:
                                          "0.5px",
                                        marginBottom:
                                          "9px",
                                      }}
                                    >
                                      Highlights
                                    </div>

                                    <ul
                                      style={{
                                        margin:
                                          0,
                                        paddingLeft:
                                          "19px",
                                        color:
                                          "#475569",
                                        fontSize:
                                          "14px",
                                        lineHeight:
                                          1.7,
                                      }}
                                    >
                                      {education.highlights.map(
                                        (
                                          highlight,
                                          highlightIndex
                                        ) => (
                                          <li
                                            key={
                                              `${educationId}-highlight-${highlightIndex}`
                                            }
                                          >
                                            {
                                              highlight
                                            }
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {education.officialVerificationUrl && (
                                <div
                                  style={{
                                    background:
                                      "#ffffff",
                                    border:
                                      "1px solid #e5e7eb",
                                    borderRadius:
                                      "13px",
                                    padding:
                                      "15px",
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        "#94a3b8",
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        800,
                                      textTransform:
                                        "uppercase",
                                      letterSpacing:
                                        "0.5px",
                                      marginBottom:
                                        "8px",
                                    }}
                                  >
                                    Official Verification
                                  </div>

                                  <a
                                    href={
                                      education.officialVerificationUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color:
                                        "#2563eb",
                                      fontSize:
                                        "13px",
                                      fontWeight:
                                        700,
                                      wordBreak:
                                        "break-all",
                                    }}
                                  >
                                    {
                                      education.officialVerificationUrl
                                    }
                                  </a>
                                </div>
                              )}

                              {/*
                               * ----------------------------------------
                               * DISPLAY CONTROLS
                               * ----------------------------------------
                               */}

                              <div
                                style={{
                                  background:
                                    "#ffffff",
                                  border:
                                    "1px solid #e5e7eb",
                                  borderRadius:
                                    "13px",
                                  padding:
                                    "15px",
                                }}
                              >
                                <div
                                  style={{
                                    color:
                                      "#94a3b8",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      800,
                                    textTransform:
                                      "uppercase",
                                    letterSpacing:
                                      "0.5px",
                                    marginBottom:
                                      "12px",
                                  }}
                                >
                                  Display Controls
                                </div>

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap:
                                      "9px",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    disabled={
                                      documentLoadingId ===
                                      `isVisible-${educationId}`
                                    }
                                    onClick={() =>
                                      updateEducationFlag(
                                        education,
                                        "isVisible",
                                        !education.isVisible
                                      )
                                    }
                                    style={{
                                      border:
                                        "1px solid #dbe1ea",
                                      background:
                                        education.isVisible
                                          ? "#ecfdf5"
                                          : "#f8fafc",
                                      color:
                                        education.isVisible
                                          ? "#047857"
                                          : "#64748b",
                                      borderRadius:
                                        "9px",
                                      padding:
                                        "8px 10px",
                                      fontSize:
                                        "12px",
                                      fontWeight:
                                        750,
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    {education.isVisible
                                      ? "👁️ Visible"
                                      : "🙈 Hidden"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      documentLoadingId ===
                                      `isFeatured-${educationId}`
                                    }
                                    onClick={() =>
                                      updateEducationFlag(
                                        education,
                                        "isFeatured",
                                        !education.isFeatured
                                      )
                                    }
                                    style={{
                                      border:
                                        "1px solid #dbe1ea",
                                      background:
                                        education.isFeatured
                                          ? "#fff7ed"
                                          : "#f8fafc",
                                      color:
                                        education.isFeatured
                                          ? "#c2410c"
                                          : "#64748b",
                                      borderRadius:
                                        "9px",
                                      padding:
                                        "8px 10px",
                                      fontSize:
                                        "12px",
                                      fontWeight:
                                        750,
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    {education.isFeatured
                                      ? "⭐ Featured"
                                      : "☆ Feature"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      documentLoadingId ===
                                      `isActive-${educationId}`
                                    }
                                    onClick={() =>
                                      updateEducationFlag(
                                        education,
                                        "isActive",
                                        !education.isActive
                                      )
                                    }
                                    style={{
                                      border:
                                        "1px solid #dbe1ea",
                                      background:
                                        education.isActive
                                          ? "#eff6ff"
                                          : "#f8fafc",
                                      color:
                                        education.isActive
                                          ? "#1d4ed8"
                                          : "#64748b",
                                      borderRadius:
                                        "9px",
                                      padding:
                                        "8px 10px",
                                      fontSize:
                                        "12px",
                                      fontWeight:
                                        750,
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    {education.isActive
                                      ? "● Active"
                                      : "○ Inactive"}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/*
                             * ------------------------------------------
                             * RIGHT DOCUMENTS
                             * ------------------------------------------
                             */}

                            <div
                              style={{
                                background:
                                  "#ffffff",
                                border:
                                  "1px solid #e5e7eb",
                                borderRadius:
                                  "14px",
                                padding:
                                  "16px",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "space-between",
                                  gap:
                                    "10px",
                                  marginBottom:
                                    "13px",
                                  flexWrap:
                                    "wrap",
                                }}
                              >
                                <div>
                                  <h3
                                    style={{
                                      margin:
                                        0,
                                      fontSize:
                                        "15px",
                                    }}
                                  >
                                    📎 Education Documents
                                  </h3>

                                  <p
                                    style={{
                                      margin:
                                        "4px 0 0",
                                      color:
                                        "#94a3b8",
                                      fontSize:
                                        "12px",
                                    }}
                                  >
                                    {documents.length}
                                    /10 documents
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    submittingDocument
                                  }
                                  onClick={() =>
                                    openUploadPicker(
                                      educationId
                                    )
                                  }
                                  style={{
                                    border:
                                      "none",
                                    borderRadius:
                                      "9px",
                                    background:
                                      "#111827",
                                    color:
                                      "#ffffff",
                                    padding:
                                      "8px 11px",
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      800,
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  ＋ Upload
                                </button>
                              </div>

                              {documents.length ===
                              0 ? (
                                <div
                                  style={{
                                    border:
                                      "1px dashed #cbd5e1",
                                    borderRadius:
                                      "12px",
                                    padding:
                                      "28px 15px",
                                    textAlign:
                                      "center",
                                    color:
                                      "#94a3b8",
                                    fontSize:
                                      "13px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize:
                                        "27px",
                                      marginBottom:
                                        "7px",
                                    }}
                                  >
                                    📄
                                  </div>

                                  No documents uploaded yet.
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display:
                                      "grid",
                                    gap:
                                      "10px",
                                  }}
                                >
                                  {documents.map(
                                    (
                                      document,
                                      documentIndex
                                    ) => {
                                      const documentId =
                                        getDocumentId(
                                          document
                                        );

                                      const loadingThis =
                                        documentLoadingId ===
                                          `preview-${documentId}` ||
                                        documentLoadingId ===
                                          `delete-${documentId}` ||
                                        documentLoadingId ===
                                          `type-${documentId}` ||
                                        documentLoadingId ===
                                          `doc-order-${documentId}` ||
                                        documentLoadingId ===
                                          `move-document-${documentId}`;

                                      return (
                                        <div
                                          key={
                                            documentId
                                          }
                                          style={{
                                            border:
                                              "1px solid #e5e7eb",
                                            borderRadius:
                                              "12px",
                                            padding:
                                              "11px",
                                            background:
                                              "#fafbfc",
                                          }}
                                        >
                                          <div
                                            style={{
                                              display:
                                                "flex",
                                              alignItems:
                                                "flex-start",
                                              gap:
                                                "10px",
                                            }}
                                          >
                                            <div
                                              style={{
                                                width:
                                                  "40px",
                                                height:
                                                  "40px",
                                                flexShrink:
                                                  0,
                                                borderRadius:
                                                  "10px",
                                                background:
                                                  isPdfMimeType(
                                                    document.mimeType
                                                  )
                                                    ? "#fff1f2"
                                                    : "#eff6ff",
                                                display:
                                                  "grid",
                                                placeItems:
                                                  "center",
                                                fontSize:
                                                  "18px",
                                              }}
                                            >
                                              {isPdfMimeType(
                                                document.mimeType
                                              )
                                                ? "📕"
                                                : "🖼️"}
                                            </div>

                                            <div
                                              style={{
                                                minWidth:
                                                  0,
                                                flex:
                                                  1,
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontSize:
                                                    "13px",
                                                  fontWeight:
                                                    750,
                                                  color:
                                                    "#334155",
                                                  wordBreak:
                                                    "break-word",
                                                }}
                                              >
                                                {document.originalName ||
                                                  "Education document"}
                                              </div>

                                              <div
                                                style={{
                                                  marginTop:
                                                    "3px",
                                                  color:
                                                    "#94a3b8",
                                                  fontSize:
                                                    "11px",
                                                }}
                                              >
                                                {getDocumentTypeLabel(
                                                  document.documentType
                                                )}{" "}
                                                ·{" "}
                                                {formatFileSize(
                                                  document.size
                                                )}
                                                {document.width &&
                                                  document.height
                                                  ? ` · ${document.width}×${document.height}`
                                                  : ""}
                                              </div>
                                            </div>

                                            <div
                                              style={{
                                                display:
                                                  "flex",
                                                gap:
                                                  "4px",
                                              }}
                                            >
                                              <button
                                                type="button"
                                                title="Move up"
                                                disabled={
                                                  documentIndex ===
                                                    0 ||
                                                  loadingThis
                                                }
                                                onClick={() =>
                                                  moveDocument(
                                                    education,
                                                    documentIndex,
                                                    "up"
                                                  )
                                                }
                                                style={{
                                                  width:
                                                    "27px",
                                                  height:
                                                    "27px",
                                                  border:
                                                    "1px solid #e2e8f0",
                                                  background:
                                                    "#ffffff",
                                                  borderRadius:
                                                    "7px",
                                                  cursor:
                                                    "pointer",
                                                }}
                                              >
                                                ↑
                                              </button>

                                              <button
                                                type="button"
                                                title="Move down"
                                                disabled={
                                                  documentIndex ===
                                                    documents.length -
                                                      1 ||
                                                  loadingThis
                                                }
                                                onClick={() =>
                                                  moveDocument(
                                                    education,
                                                    documentIndex,
                                                    "down"
                                                  )
                                                }
                                                style={{
                                                  width:
                                                    "27px",
                                                  height:
                                                    "27px",
                                                  border:
                                                    "1px solid #e2e8f0",
                                                  background:
                                                    "#ffffff",
                                                  borderRadius:
                                                    "7px",
                                                  cursor:
                                                    "pointer",
                                                }}
                                              >
                                                ↓
                                              </button>
                                            </div>
                                          </div>

                                          <div
                                            style={{
                                              display:
                                                "flex",
                                              gap:
                                                "6px",
                                              flexWrap:
                                                "wrap",
                                              marginTop:
                                                "9px",
                                            }}
                                          >
                                            <select
                                              value={
                                                document.documentType ||
                                                "marksheet"
                                              }
                                              disabled={
                                                loadingThis
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateDocumentType(
                                                  educationId,
                                                  documentId,
                                                  event.target.value
                                                )
                                              }
                                              style={{
                                                border:
                                                  "1px solid #dbe1ea",
                                                borderRadius:
                                                  "7px",
                                                padding:
                                                  "6px 8px",
                                                background:
                                                  "#ffffff",
                                                fontSize:
                                                  "11px",
                                                flex:
                                                  "1 1 110px",
                                              }}
                                            >
                                              {DOCUMENT_TYPES.map(
                                                (
                                                  type
                                                ) => (
                                                  <option
                                                    key={
                                                      type.value
                                                    }
                                                    value={
                                                      type.value
                                                    }
                                                  >
                                                    {
                                                      type.label
                                                    }
                                                  </option>
                                                )
                                              )}
                                            </select>

                                            <button
                                              type="button"
                                              disabled={
                                                loadingThis
                                              }
                                              onClick={() =>
                                                previewDocument(
                                                  educationId,
                                                  document
                                                )
                                              }
                                              style={{
                                                border:
                                                  "1px solid #dbe1ea",
                                                background:
                                                  "#ffffff",
                                                color:
                                                  "#334155",
                                                borderRadius:
                                                  "7px",
                                                padding:
                                                  "6px 9px",
                                                fontSize:
                                                  "11px",
                                                fontWeight:
                                                  750,
                                                cursor:
                                                  "pointer",
                                              }}
                                            >
                                              {documentLoadingId ===
                                              `preview-${documentId}`
                                                ? "Opening..."
                                                : "👁️ Preview"}
                                            </button>

                                            <button
                                              type="button"
                                              disabled={
                                                submittingDocument
                                              }
                                              onClick={() =>
                                                openReplacePicker(
                                                  educationId,
                                                  document
                                                )
                                              }
                                              style={{
                                                border:
                                                  "1px solid #dbe1ea",
                                                background:
                                                  "#ffffff",
                                                color:
                                                  "#334155",
                                                borderRadius:
                                                  "7px",
                                                padding:
                                                  "6px 9px",
                                                fontSize:
                                                  "11px",
                                                fontWeight:
                                                  750,
                                                cursor:
                                                  "pointer",
                                              }}
                                            >
                                              ♻️ Replace
                                            </button>

                                            <button
                                              type="button"
                                              disabled={
                                                loadingThis
                                              }
                                              onClick={() =>
                                                requestDeleteDocument(
                                                  education,
                                                  document
                                                )
                                              }
                                              style={{
                                                border:
                                                  "1px solid #fecdd3",
                                                background:
                                                  "#fff1f2",
                                                color:
                                                  "#be123c",
                                                borderRadius:
                                                  "7px",
                                                padding:
                                                  "6px 9px",
                                                fontSize:
                                                  "11px",
                                                fontWeight:
                                                  750,
                                                cursor:
                                                  "pointer",
                                              }}
                                            >
                                              {documentLoadingId ===
                                              `delete-${documentId}`
                                                ? "Deleting..."
                                                : "🗑️ Delete"}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                              <div
                                style={{
                                  marginTop:
                                    "12px",
                                  color:
                                    "#94a3b8",
                                  fontSize:
                                    "11px",
                                  lineHeight:
                                    1.55,
                                }}
                              >
                                Supported: PDF, JPG, JPEG,
                                PNG, WEBP · Maximum 10 MB
                                per document.
                              </div>
                            </div>
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

        {/*
         |--------------------------------------------------------------------------
         | HIDDEN FILE INPUTS
         |--------------------------------------------------------------------------
         */}

        <input
          ref={
            fileInputRef
          }
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          style={{
            display:
              "none",
          }}
          onChange={
            handleDocumentUpload
          }
        />

        <input
          ref={
            replaceFileInputRef
          }
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          style={{
            display:
              "none",
          }}
          onChange={
            handleDocumentReplace
          }
        />

        {/*
         |--------------------------------------------------------------------------
         | UPLOAD DOCUMENT TYPE MODAL
         |--------------------------------------------------------------------------
         */}

        {uploadTargetId && (
          <div
            style={{
              position:
                "fixed",
              inset:
                0,
              zIndex:
                1500,
              background:
                "rgba(15,23,42,0.48)",
              display:
                "grid",
              placeItems:
                "center",
              padding:
                "20px",
            }}
          >
            <div
              style={{
                width:
                  "min(420px, 100%)",
                background:
                  "#ffffff",
                borderRadius:
                  "18px",
                padding:
                  "22px",
                boxShadow:
                  "0 30px 80px rgba(15,23,42,0.24)",
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 7px",
                  fontSize:
                    "19px",
                }}
              >
                📎 Upload Education Document
              </h3>

              <p
                style={{
                  margin:
                    "0 0 17px",
                  color:
                    "#64748b",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.55,
                }}
              >
                Select the document type before choosing
                the file.
              </p>

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "7px",
                  fontSize:
                    "12px",
                  fontWeight:
                    800,
                  color:
                    "#475569",
                }}
              >
                Document Type
              </label>

              <select
                value={
                  documentType
                }
                onChange={(
                  event
                ) =>
                  setDocumentType(
                    event.target.value
                  )
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  border:
                    "1px solid #dbe1ea",
                  borderRadius:
                    "10px",
                  padding:
                    "11px 12px",
                  background:
                    "#ffffff",
                  fontSize:
                    "14px",
                }}
              >
                {DOCUMENT_TYPES.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type.value
                      }
                      value={
                        type.value
                      }
                    >
                      {
                        type.label
                      }
                    </option>
                  )
                )}
              </select>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "8px",
                  marginTop:
                    "18px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setUploadTargetId(
                      null
                    )
                  }
                  style={{
                    border:
                      "1px solid #dbe1ea",
                    background:
                      "#ffffff",
                    color:
                      "#334155",
                    borderRadius:
                      "9px",
                    padding:
                      "9px 13px",
                    fontWeight:
                      750,
                    cursor:
                      "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    submittingDocument
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "#111827",
                    color:
                      "#ffffff",
                    borderRadius:
                      "9px",
                    padding:
                      "9px 13px",
                    fontWeight:
                      800,
                    cursor:
                      "pointer",
                  }}
                >
                  {submittingDocument
                    ? "Uploading..."
                    : "Choose File"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/*
         |--------------------------------------------------------------------------
         | DOCUMENT PREVIEW MODAL
         |--------------------------------------------------------------------------
         */}

        {documentPreview && (
          <div
            style={{
              position:
                "fixed",
              inset:
                0,
              zIndex:
                1600,
              background:
                "rgba(15,23,42,0.72)",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding:
                "20px",
            }}
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setDocumentPreview(
                  null
                );
              }
            }}
          >
            <div
              style={{
                width:
                  "min(1100px, 100%)",
                height:
                  "min(88vh, 850px)",
                background:
                  "#ffffff",
                borderRadius:
                  "18px",
                overflow:
                  "hidden",
                display:
                  "flex",
                flexDirection:
                  "column",
                boxShadow:
                  "0 30px 100px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  padding:
                    "13px 16px",
                  borderBottom:
                    "1px solid #e5e7eb",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap:
                    "12px",
                }}
              >
                <div
                  style={{
                    minWidth:
                      0,
                  }}
                >
                  <div
                    style={{
                      fontWeight:
                        800,
                      fontSize:
                        "14px",
                      overflow:
                        "hidden",
                      textOverflow:
                        "ellipsis",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {
                      documentPreview.originalName
                    }
                  </div>

                  <div
                    style={{
                      marginTop:
                        "3px",
                      color:
                        "#94a3b8",
                      fontSize:
                        "11px",
                    }}
                  >
                    {getDocumentTypeLabel(
                      documentPreview.documentType
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap:
                      "7px",
                  }}
                >
                  <a
                    href={
                      documentPreview.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      border:
                        "1px solid #dbe1ea",
                      background:
                        "#ffffff",
                      color:
                        "#334155",
                      textDecoration:
                        "none",
                      borderRadius:
                        "8px",
                      padding:
                        "7px 10px",
                      fontSize:
                        "12px",
                      fontWeight:
                        750,
                    }}
                  >
                    ↗ Open
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      setDocumentPreview(
                        null
                      )
                    }
                    style={{
                      width:
                        "34px",
                      height:
                        "34px",
                      border:
                        "none",
                      borderRadius:
                        "8px",
                      background:
                        "#f1f5f9",
                      color:
                        "#334155",
                      cursor:
                        "pointer",
                      fontSize:
                        "18px",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex:
                    1,
                  overflow:
                    "auto",
                  background:
                    "#f1f5f9",
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  padding:
                    "18px",
                  boxSizing:
                    "border-box",
                }}
              >
                {isImageMimeType(
                  documentPreview.mimeType
                ) ? (
                  <img
                    src={
                      documentPreview.url
                    }
                    alt={
                      documentPreview.originalName ||
                      "Education document"
                    }
                    style={{
                      maxWidth:
                        "100%",
                      maxHeight:
                        "100%",
                      width:
                        "auto",
                      height:
                        "auto",
                      objectFit:
                        "contain",
                      display:
                        "block",
                    }}
                  />
                ) : isPdfMimeType(
                    documentPreview.mimeType
                  ) ? (
                  <iframe
                    title={
                      documentPreview.originalName ||
                      "Education PDF"
                    }
                    src={
                      documentPreview.url
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      border:
                        "none",
                      background:
                        "#ffffff",
                      borderRadius:
                        "10px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      textAlign:
                        "center",
                      color:
                        "#64748b",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "42px",
                        marginBottom:
                          "10px",
                      }}
                    >
                      📄
                    </div>

                    Preview is not available for this
                    file type.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/*
         |--------------------------------------------------------------------------
         | EDUCATION CREATE / EDIT MODAL
         |--------------------------------------------------------------------------
         */}

        {formOpen && (
          <div
            style={{
              position:
                "fixed",
              inset:
                0,
              zIndex:
                1400,
              background:
                "rgba(15,23,42,0.52)",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding:
                "20px",
              overflowY:
                "auto",
            }}
          >
            <div
              style={{
                width:
                  "min(920px, 100%)",
                maxHeight:
                  "92vh",
                overflowY:
                  "auto",
                background:
                  "#ffffff",
                borderRadius:
                  "20px",
                boxShadow:
                  "0 30px 90px rgba(15,23,42,0.25)",
              }}
            >
              <div
                style={{
                  position:
                    "sticky",
                  top:
                    0,
                  zIndex:
                    2,
                  background:
                    "#ffffff",
                  borderBottom:
                    "1px solid #e5e7eb",
                  padding:
                    "18px 20px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap:
                    "15px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin:
                        0,
                      fontSize:
                        "20px",
                    }}
                  >
                    {editingId
                      ? "✏️ Edit Education"
                      : "🎓 Add Education"}
                  </h2>

                  <p
                    style={{
                      margin:
                        "4px 0 0",
                      color:
                        "#64748b",
                      fontSize:
                        "12px",
                    }}
                  >
                    Manage academic information and
                    public display settings.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeForm
                  }
                  style={{
                    width:
                      "35px",
                    height:
                      "35px",
                    border:
                      "none",
                    borderRadius:
                      "9px",
                    background:
                      "#f1f5f9",
                    color:
                      "#334155",
                    fontSize:
                      "19px",
                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleSubmit
                }
              >
                <div
                  style={{
                    padding:
                      "22px 20px",
                    display:
                      "grid",
                    gap:
                      "18px",
                  }}
                >
                  {/*
                   * -----------------------------------------------
                   * BASIC INFORMATION
                   * -----------------------------------------------
                   */}

                  <div
                    style={{
                      fontSize:
                        "12px",
                      fontWeight:
                        850,
                      color:
                        "#64748b",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.6px",
                    }}
                  >
                    Basic Information
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap:
                        "14px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Education Level *
                      </label>

                      <select
                        name="educationLevel"
                        value={
                          form.educationLevel
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          background:
                            "#ffffff",
                          fontSize:
                            "14px",
                        }}
                      >
                        {EDUCATION_LEVELS.map(
                          (
                            level
                          ) => (
                            <option
                              key={
                                level.value
                              }
                              value={
                                level.value
                              }
                            >
                              {
                                level.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Degree / Qualification *
                      </label>

                      <input
                        type="text"
                        name="degreeName"
                        value={
                          form.degreeName
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. MCA — Pursuing"
                        required
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                          outline:
                            "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Institution Name *
                      </label>

                      <input
                        type="text"
                        name="institutionName"
                        value={
                          form.institutionName
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. Graphic Era University"
                        required
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                          outline:
                            "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Board / University
                      </label>

                      <input
                        type="text"
                        name="boardOrUniversity"
                        value={
                          form.boardOrUniversity
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. Graphic Era University"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                          outline:
                            "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Field of Study
                      </label>

                      <input
                        type="text"
                        name="fieldOfStudy"
                        value={
                          form.fieldOfStudy
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. Computer Applications"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                          outline:
                            "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Location
                      </label>

                      <input
                        type="text"
                        name="location"
                        value={
                          form.location
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. Dehradun, Uttarakhand"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                          outline:
                            "none",
                        }}
                      />
                    </div>
                  </div>

                  {/*
                   * -----------------------------------------------
                   * DATES
                   * -----------------------------------------------
                   */}

                  <div
                    style={{
                      fontSize:
                        "12px",
                      fontWeight:
                        850,
                      color:
                        "#64748b",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.6px",
                      marginTop:
                        "5px",
                    }}
                  >
                    Timeline
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",
                      gap:
                        "14px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Start Date *
                      </label>

                      <input
                        type="date"
                        name="startDate"
                        value={
                          form.startDate
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "10px 11px",
                          fontSize:
                            "14px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        End Date
                      </label>

                      <input
                        type="date"
                        name="endDate"
                        value={
                          form.endDate
                        }
                        onChange={
                          handleFormChange
                        }
                        disabled={
                          form.currentlyStudying
                        }
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "10px 11px",
                          fontSize:
                            "14px",
                          background:
                            form.currentlyStudying
                              ? "#f8fafc"
                              : "#ffffff",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Duration
                      </label>

                      <input
                        type="text"
                        name="duration"
                        value={
                          form.duration
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. 2025 — Present"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                        }}
                      />
                    </div>
                  </div>

                  <label
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "9px",
                      width:
                        "fit-content",
                      cursor:
                        "pointer",
                      fontSize:
                        "13px",
                      fontWeight:
                        700,
                      color:
                        "#334155",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="currentlyStudying"
                      checked={
                        form.currentlyStudying
                      }
                      onChange={
                        handleFormChange
                      }
                    />
                    Currently studying
                  </label>

                  {/*
                   * -----------------------------------------------
                   * ACADEMIC PERFORMANCE
                   * -----------------------------------------------
                   */}

                  <div
                    style={{
                      fontSize:
                        "12px",
                      fontWeight:
                        850,
                      color:
                        "#64748b",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.6px",
                      marginTop:
                        "5px",
                    }}
                  >
                    Academic Performance
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",
                      gap:
                        "14px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Grade
                      </label>

                      <input
                        type="text"
                        name="grade"
                        value={
                          form.grade
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. A / First Division"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        Percentage
                      </label>

                      <input
                        type="number"
                        name="percentage"
                        value={
                          form.percentage
                        }
                        onChange={
                          handleFormChange
                        }
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g. 83.10"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            "7px",
                          fontSize:
                            "12px",
                          fontWeight:
                            800,
                          color:
                            "#475569",
                        }}
                      >
                        CGPA
                      </label>

                      <input
                        type="number"
                        name="cgpa"
                        value={
                          form.cgpa
                        }
                        onChange={
                          handleFormChange
                        }
                        min="0"
                        step="0.01"
                        placeholder="e.g. 8.31"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          border:
                            "1px solid #dbe1ea",
                          borderRadius:
                            "10px",
                          padding:
                            "11px 12px",
                          fontSize:
                            "14px",
                        }}
                      />
                    </div>
                  </div>

                  {/*
                   * -----------------------------------------------
                   * DESCRIPTION
                   * -----------------------------------------------
                   */}

                  <div
                    style={{
                      fontSize:
                        "12px",
                      fontWeight:
                        850,
                      color:
                        "#64748b",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.6px",
                      marginTop:
                        "5px",
                    }}
                  >
                    Additional Information
                  </div>

                  <div>
                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontSize:
                          "12px",
                        fontWeight:
                          800,
                        color:
                          "#475569",
                      }}
                    >
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleFormChange
                      }
                      rows={
                        5
                      }
                      placeholder="Describe this academic journey, achievements or relevant details..."
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        border:
                          "1px solid #dbe1ea",
                        borderRadius:
                          "10px",
                        padding:
                          "11px 12px",
                        fontSize:
                          "14px",
                        resize:
                          "vertical",
                        lineHeight:
                          1.55,
                        fontFamily:
                          "inherit",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontSize:
                          "12px",
                        fontWeight:
                          800,
                        color:
                          "#475569",
                      }}
                    >
                      Highlights
                    </label>

                    <textarea
                      value={form.highlights.join(
                        "\n"
                      )}
                      onChange={
                        handleHighlightsChange
                      }
                      rows={
                        5
                      }
                      placeholder="One highlight per line"
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        border:
                          "1px solid #dbe1ea",
                        borderRadius:
                          "10px",
                        padding:
                          "11px 12px",
                        fontSize:
                          "14px",
                        resize:
                          "vertical",
                        lineHeight:
                          1.55,
                        fontFamily:
                          "inherit",
                      }}
                    />

                    <div
                      style={{
                        marginTop:
                          "5px",
                        color:
                          "#94a3b8",
                        fontSize:
                          "11px",
                      }}
                    >
                      Enter each academic achievement
                      or highlight on a separate line.
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontSize:
                          "12px",
                        fontWeight:
                          800,
                        color:
                          "#475569",
                      }}
                    >
                      Official Verification URL
                    </label>

                    <input
                      type="url"
                      name="officialVerificationUrl"
                      value={
                        form.officialVerificationUrl
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="https://..."
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        border:
                          "1px solid #dbe1ea",
                        borderRadius:
                          "10px",
                        padding:
                          "11px 12px",
                        fontSize:
                          "14px",
                      }}
                    />
                  </div>

                  {/*
                   * -----------------------------------------------
                   * DISPLAY SETTINGS
                   * -----------------------------------------------
                   */}

                  <div
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      borderRadius:
                        "14px",
                      padding:
                        "16px",
                      background:
                        "#fafbfc",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "12px",
                        fontWeight:
                          850,
                        color:
                          "#64748b",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.6px",
                        marginBottom:
                          "13px",
                      }}
                    >
                      Public Display Settings
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap:
                          "11px",
                      }}
                    >
                      <label
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "9px",
                          cursor:
                            "pointer",
                          fontSize:
                            "13px",
                          fontWeight:
                            700,
                        }}
                      >
                        <input
                          type="checkbox"
                          name="isVisible"
                          checked={
                            form.isVisible
                          }
                          onChange={
                            handleFormChange
                          }
                        />
                        👁️ Show on public portfolio
                      </label>

                      <label
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "9px",
                          cursor:
                            "pointer",
                          fontSize:
                            "13px",
                          fontWeight:
                            700,
                        }}
                      >
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={
                            form.isFeatured
                          }
                          onChange={
                            handleFormChange
                          }
                        />
                        ⭐ Mark as featured
                      </label>

                      <label
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "9px",
                          cursor:
                            "pointer",
                          fontSize:
                            "13px",
                          fontWeight:
                            700,
                        }}
                      >
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={
                            form.isActive
                          }
                          onChange={
                            handleFormChange
                          }
                        />
                        ● Active record
                      </label>

                      <div>
                        <label
                          style={{
                            display:
                              "block",
                            marginBottom:
                              "6px",
                            fontSize:
                              "11px",
                            fontWeight:
                              800,
                            color:
                              "#64748b",
                          }}
                        >
                          Display Order
                        </label>

                        <input
                          type="number"
                          name="displayOrder"
                          value={
                            form.displayOrder
                          }
                          onChange={
                            handleFormChange
                          }
                          min="0"
                          step="1"
                          style={{
                            width:
                              "100%",
                            boxSizing:
                              "border-box",
                            border:
                              "1px solid #dbe1ea",
                            borderRadius:
                              "9px",
                            padding:
                              "9px 10px",
                            fontSize:
                              "13px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/*
                 * -------------------------------------------------------
                 * FORM FOOTER
                 * -------------------------------------------------------
                 */}

                <div
                  style={{
                    position:
                      "sticky",
                    bottom:
                      0,
                    background:
                      "#ffffff",
                    borderTop:
                      "1px solid #e5e7eb",
                    padding:
                      "14px 20px",
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap:
                      "8px",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      closeForm
                    }
                    style={{
                      border:
                        "1px solid #dbe1ea",
                      background:
                        "#ffffff",
                      color:
                        "#334155",
                      borderRadius:
                        "9px",
                      padding:
                        "10px 15px",
                      fontWeight:
                        750,
                      cursor:
                        "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "#111827",
                      color:
                        "#ffffff",
                      borderRadius:
                        "9px",
                      padding:
                        "10px 17px",
                      fontWeight:
                        800,
                      cursor:
                        "pointer",
                    }}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "💾 Update Education"
                      : "＋ Create Education"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*
         |--------------------------------------------------------------------------
         | CONFIRMATION MODAL
         |--------------------------------------------------------------------------
         */}

        {confirmModal && (
          <div
            style={{
              position:
                "fixed",
              inset:
                0,
              zIndex:
                1800,
              background:
                "rgba(15,23,42,0.58)",
              display:
                "grid",
              placeItems:
                "center",
              padding:
                "20px",
            }}
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeConfirmation();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              style={{
                width:
                  "min(430px, 100%)",
                background:
                  "#ffffff",
                borderRadius:
                  "18px",
                padding:
                  "22px",
                boxShadow:
                  "0 30px 90px rgba(0,0,0,0.28)",
              }}
            >
              <div
                style={{
                  width:
                    "44px",
                  height:
                    "44px",
                  borderRadius:
                    "13px",
                  background:
                    confirmModal.danger
                      ? "#fff1f2"
                      : "#eff6ff",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  fontSize:
                    "21px",
                  marginBottom:
                    "13px",
                }}
              >
                {confirmModal.danger
                  ? "⚠️"
                  : "❓"}
              </div>

              <h3
                style={{
                  margin:
                    "0 0 7px",
                  fontSize:
                    "19px",
                }}
              >
                {
                  confirmModal.title
                }
              </h3>

              <p
                style={{
                  margin:
                    "0",
                  color:
                    "#64748b",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.65,
                }}
              >
                {
                  confirmModal.message
                }
              </p>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "8px",
                  marginTop:
                    "20px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    closeConfirmation
                  }
                  style={{
                    border:
                      "1px solid #dbe1ea",
                    background:
                      "#ffffff",
                    color:
                      "#334155",
                    borderRadius:
                      "9px",
                    padding:
                      "9px 13px",
                    fontWeight:
                      750,
                    cursor:
                      "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const callback =
                      confirmModal.onConfirm;

                    setConfirmModal(
                      null
                    );

                    if (
                      typeof callback ===
                      "function"
                    ) {
                      callback();
                    }
                  }}
                  style={{
                    border:
                      "none",
                    background:
                      confirmModal.danger
                        ? "#be123c"
                        : "#111827",
                    color:
                      "#ffffff",
                    borderRadius:
                      "9px",
                    padding:
                      "9px 14px",
                    fontWeight:
                      800,
                    cursor:
                      "pointer",
                  }}
                >
                  {
                    confirmModal.confirmText
                  }
                </button>
              </div>

              <div
                style={{
                  marginTop:
                    "11px",
                  textAlign:
                    "right",
                  color:
                    "#94a3b8",
                  fontSize:
                    "10px",
                }}
              >
                Press Enter to confirm · Esc to cancel
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default AdminEducation;