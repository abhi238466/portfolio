import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import "./AdminProjects.css";

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
| DEFAULT FORM
|--------------------------------------------------------------------------
*/

const createEmptyForm = () => ({
  title: "",
  shortDescription: "",
  fullDescription: "",
  category: "",
  role: "",

  technologies: [],

  features: [],

  images: [],

  links: [],

  githubUrl: "",

  liveDemoUrl: "",

  startDate: "",

  endDate: "",

  status: "completed",

  projectType: "individual",

  teamSize: "",

  futureImprovements: "",

  isVisible: true,

  isFeatured: false,

  displayOrder: 0,

  isActive: true,
});

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_TITLE_LENGTH = 150;
const MAX_SHORT_DESCRIPTION_LENGTH = 300;
const MAX_FULL_DESCRIPTION_LENGTH = 3000;
const MAX_CATEGORY_LENGTH = 100;
const MAX_ROLE_LENGTH = 150;
const MAX_TECHNOLOGIES = 30;
const MAX_FEATURES = 50;
const MAX_LINKS = 20;
const MAX_IMAGES = 20;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  if (
    error &&
    typeof error === "object"
  ) {
    return (
      error.message ||
      fallback
    );
  }

  return fallback;
};

const getProjectId = (
  project
) => {
  return (
    project?.id ||
    project?._id ||
    ""
  );
};

const normalizeProjectForForm = (
  project
) => {
  if (!project) {
    return createEmptyForm();
  }

  return {
    title:
      project.title || "",

    shortDescription:
      project.shortDescription ||
      "",

    fullDescription:
      project.fullDescription ||
      "",

    category:
      project.category || "",

    role:
      project.role || "",

    technologies:
      Array.isArray(
        project.technologies
      )
        ? project.technologies
        : [],

    features:
      Array.isArray(
        project.features
      )
        ? project.features
        : [],

    images:
      Array.isArray(project.images)
        ? project.images
        : [],

    links:
      Array.isArray(project.links)
        ? project.links
        : [],

    githubUrl:
      project.githubUrl || "",

    liveDemoUrl:
      project.liveDemoUrl || "",

    startDate:
      project.startDate
        ? String(
            project.startDate
          ).slice(0, 10)
        : "",

    endDate:
      project.endDate
        ? String(
            project.endDate
          ).slice(0, 10)
        : "",

    status:
      project.status ||
      "completed",

    projectType:
      project.projectType ||
      "individual",

    teamSize:
      project.teamSize ??
      "",

    futureImprovements:
      project.futureImprovements ||
      "",

    isVisible:
      project.isVisible !==
      false,

    isFeatured:
      project.isFeatured ===
      true,

    displayOrder:
      Number(
        project.displayOrder || 0
      ),

    isActive:
      project.isActive !==
      false,
  };
};

const validateHttpUrl = (
  value
) => {
  if (!value) {
    return true;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const AdminProjects = () => {
  const navigate =
    useNavigate();

  const imageInputRef =
    useRef(null);

  /*
   * ================================================================
   * STATE
   * ================================================================
   */

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm()
  );

  const [
    editingProjectId,
    setEditingProjectId,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    dirty,
    setDirty,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState(null);

  const [
    confirmDialog,
    setConfirmDialog,
  ] = useState(null);

  const [
    imagePreviews,
    setImagePreviews,
  ] = useState([]);

  const [
    newTechnology,
    setNewTechnology,
  ] = useState("");

  const [
    newFeature,
    setNewFeature,
  ] = useState("");

  const [
    newLink,
    setNewLink,
  ] = useState({
    label: "",
    url: "",
    type: "other",
    visible: true,
  });

  /*
   * ================================================================
   * TOAST
   * ================================================================
   */

  const showToast = useCallback(
    (
      type,
      message
    ) => {
      setToast({
        type,
        message,
      });

      window.setTimeout(
        () => {
          setToast(null);
        },
        4000
      );
    },
    []
  );

  /*
   * ================================================================
   * FETCH ADMIN PROJECTS
   * ================================================================
   */

  const fetchProjects =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              `${API_BASE_URL}/api/admin/projects`,
              {
                method: "GET",

                credentials:
                  "include",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to load projects."
            );
          }

          const receivedProjects =
            Array.isArray(
              data?.projects
            )
              ? data.projects
              : Array.isArray(
                    data?.data
                  )
                ? data.data
                : Array.isArray(
                      data
                    )
                  ? data
                  : [];

          setProjects(
            receivedProjects
          );
        } catch (error) {
          showToast(
            "error",
            getErrorMessage(
              error,
              "Unable to load projects."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [showToast]
    );

  /*
   * ================================================================
   * INITIAL LOAD
   * ================================================================
   */

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /*
   * ================================================================
   * FORM FIELD HANDLER
   * ================================================================
   */

  const handleFieldChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );

    setDirty(true);
  };

  /*
   * ================================================================
   * TECHNOLOGY MANAGEMENT
   * ================================================================
   */

  const addTechnology = () => {
    const value =
      newTechnology.trim();

    if (!value) {
      showToast(
        "warning",
        "Please enter a technology."
      );

      return;
    }

    if (
      form.technologies.length >=
      MAX_TECHNOLOGIES
    ) {
      showToast(
        "warning",
        `Maximum ${MAX_TECHNOLOGIES} technologies are allowed.`
      );

      return;
    }

    const alreadyExists =
      form.technologies.some(
        (technology) =>
          technology.toLowerCase() ===
          value.toLowerCase()
      );

    if (alreadyExists) {
      showToast(
        "warning",
        "This technology is already added."
      );

      return;
    }

    setForm(
      (previous) => ({
        ...previous,

        technologies: [
          ...previous.technologies,
          value,
        ],
      })
    );

    setNewTechnology("");

    setDirty(true);
  };

  const removeTechnology = (
    index
  ) => {
    setForm(
      (previous) => ({
        ...previous,

        technologies:
          previous.technologies.filter(
            (_, itemIndex) =>
              itemIndex !== index
          ),
      })
    );

    setDirty(true);
  };

  /*
   * ================================================================
   * FEATURE MANAGEMENT
   * ================================================================
   */

  const addFeature = () => {
    const value =
      newFeature.trim();

    if (!value) {
      showToast(
        "warning",
        "Please enter a feature."
      );

      return;
    }

    if (
      form.features.length >=
      MAX_FEATURES
    ) {
      showToast(
        "warning",
        `Maximum ${MAX_FEATURES} features are allowed.`
      );

      return;
    }

    setForm(
      (previous) => ({
        ...previous,

        features: [
          ...previous.features,
          value,
        ],
      })
    );

    setNewFeature("");

    setDirty(true);
  };

  const removeFeature = (
    index
  ) => {
    setForm(
      (previous) => ({
        ...previous,

        features:
          previous.features.filter(
            (_, itemIndex) =>
              itemIndex !== index
          ),
      })
    );

    setDirty(true);
  };

  /*
   * ================================================================
   * LINK MANAGEMENT
   * ================================================================
   */

  const handleNewLinkChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setNewLink(
      (previous) => ({
        ...previous,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );
  };

  const addLink = () => {
    const label =
      newLink.label.trim();

    const url =
      newLink.url.trim();

    if (!label) {
      showToast(
        "warning",
        "Link label is required."
      );

      return;
    }

    if (!url) {
      showToast(
        "warning",
        "Link URL is required."
      );

      return;
    }

    if (
      !validateHttpUrl(url) &&
      !(
        url.startsWith("/") &&
        !url.startsWith("//")
      )
    ) {
      showToast(
        "warning",
        "Please enter a valid HTTP/HTTPS URL."
      );

      return;
    }

    if (
      form.links.length >=
      MAX_LINKS
    ) {
      showToast(
        "warning",
        `Maximum ${MAX_LINKS} links are allowed.`
      );

      return;
    }

    setForm(
      (previous) => ({
        ...previous,

        links: [
          ...previous.links,

          {
            label,
            url,
            type:
              newLink.type ||
              "other",
            visible:
              newLink.visible !==
              false,
            displayOrder:
              previous.links.length,
          },
        ],
      })
    );

    setNewLink({
      label: "",
      url: "",
      type: "other",
      visible: true,
    });

    setDirty(true);
  };

  const removeLink = (
    index
  ) => {
    setForm(
      (previous) => ({
        ...previous,

        links:
          previous.links
            .filter(
              (_, itemIndex) =>
                itemIndex !== index
            )
            .map(
              (
                link,
                itemIndex
              ) => ({
                ...link,
                displayOrder:
                  itemIndex,
              })
            ),
      })
    );

    setDirty(true);
  };

  const toggleLinkVisibility = (
    index
  ) => {
    setForm(
      (previous) => ({
        ...previous,

        links:
          previous.links.map(
            (link, itemIndex) =>
              itemIndex ===
              index
                ? {
                    ...link,
                    visible:
                      !link.visible,
                  }
                : link
          ),
      })
    );

    setDirty(true);
  };

  /*
   * ================================================================
   * IMAGE SELECTION
   * ================================================================
   |
   | Actual Cloudinary upload is connected in the next backend step.
   | For now this prepares local previews and preserves dimensions.
   |
   */

  const handleImageSelection = (
    event
  ) => {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    if (!files.length) {
      return;
    }

    if (
      form.images.length +
        files.length >
      MAX_IMAGES
    ) {
      showToast(
        "warning",
        `Maximum ${MAX_IMAGES} images are allowed per project.`
      );

      event.target.value = "";

      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type
        )
      ) {
        showToast(
          "error",
          `${file.name}: only JPG, JPEG, PNG and WEBP are allowed.`
        );

        continue;
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        showToast(
          "error",
          `${file.name}: image size cannot exceed 10 MB.`
        );

        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      event.target.value = "";

      return;
    }

    validFiles.forEach(
      (file) => {
        const objectUrl =
          URL.createObjectURL(
            file
          );

        const image =
          new Image();

        image.onload = () => {
          setImagePreviews(
            (previous) => [
              ...previous,

              {
                tempId:
                  `${Date.now()}-${Math.random()}`,

                file,

                previewUrl:
                  objectUrl,

                width:
                  image.naturalWidth,

                height:
                  image.naturalHeight,
              },
            ]
          );
        };

        image.onerror = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          showToast(
            "error",
            `${file.name}: unable to read image.`
          );
        };

        image.src =
          objectUrl;
      }
    );

    setDirty(true);

    event.target.value = "";
  };

  const removeImagePreview = (
    tempId
  ) => {
    setImagePreviews(
      (previous) => {
        const target =
          previous.find(
            (item) =>
              item.tempId ===
              tempId
          );

        if (
          target?.previewUrl
        ) {
          URL.revokeObjectURL(
            target.previewUrl
          );
        }

        return previous.filter(
          (item) =>
            item.tempId !==
            tempId
        );
      }
    );

    setDirty(true);
  };

  /*
   * ================================================================
   * REMOVE EXISTING PROJECT IMAGE
   * ================================================================
   |
   | Existing Cloudinary images can be removed from the project
   | through the protected backend image-delete endpoint.
   |
   | The backend is responsible for removing:
   |
   | 1. Image metadata from MongoDB
   | 2. Actual image asset from Cloudinary
   |
   */

  const requestDeleteExistingProjectImage =
    (
      image
    ) => {
      const projectId =
        editingProjectId;

      const imageId =
        image?._id ||
        image?.id ||
        "";

      if (!projectId) {
        showToast(
          "error",
          "Project ID is missing."
        );

        return;
      }

      if (!imageId) {
        showToast(
          "error",
          "Image ID is missing."
        );

        return;
      }

      setConfirmDialog({
        title:
          "Remove Project Image?",
        message:
          `This will permanently remove "${image.originalName || "this image"}" from the project and delete its Cloudinary file. This action cannot be undone.`,
        confirmLabel:
          "Remove Image",
        danger: true,
        onConfirm: () =>
          deleteExistingProjectImage(
            projectId,
            imageId
          ),
      });
    };

  const deleteExistingProjectImage =
    async (
      projectId,
      imageId
    ) => {
      try {
        setSaving(true);

        setConfirmDialog(
          null
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/projects/${projectId}/images/${imageId}`,
            {
              method: "DELETE",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to remove project image."
          );
        }

        /*
         * Refresh the project currently being edited so that
         * primary-image reassignment or display-order changes
         * made by the backend are reflected immediately.
         */
        const projectResponse =
          await fetch(
            `${API_BASE_URL}/api/admin/projects/${projectId}`,
            {
              method: "GET",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const projectData =
          await projectResponse.json();

        if (
          !projectResponse.ok
        ) {
          throw new Error(
            projectData?.message ||
              "Image was removed, but the updated project could not be loaded."
          );
        }

        const updatedProject =
          projectData?.project ||
          projectData?.data ||
          projectData;

        setForm(
          normalizeProjectForForm(
            updatedProject
          )
        );

        setDirty(false);

        showToast(
          "success",
          "🗑️ Project image removed successfully."
        );

        await fetchProjects();
      } catch (error) {
        showToast(
          "error",
          getErrorMessage(
            error,
            "Unable to remove project image."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * ================================================================
   * IMAGE CLEANUP
   * ================================================================
   */

  useEffect(() => {
    return () => {
      imagePreviews.forEach(
        (item) => {
          if (
            item.previewUrl
          ) {
            URL.revokeObjectURL(
              item.previewUrl
            );
          }
        }
      );
    };
  }, [imagePreviews]);

  /*
   * ================================================================
   * VALIDATION
   * ================================================================
   */

  const validateForm = () => {
    if (
      !form.title.trim()
    ) {
      return "Project title is required.";
    }

    if (
      form.title.trim()
        .length >
      MAX_TITLE_LENGTH
    ) {
      return `Project title cannot exceed ${MAX_TITLE_LENGTH} characters.`;
    }

    if (
      !form.shortDescription.trim()
    ) {
      return "Short description is required.";
    }

    if (
      form.shortDescription.trim()
        .length >
      MAX_SHORT_DESCRIPTION_LENGTH
    ) {
      return `Short description cannot exceed ${MAX_SHORT_DESCRIPTION_LENGTH} characters.`;
    }

    if (
      !form.category.trim()
    ) {
      return "Project category is required.";
    }

    if (
      form.technologies.length ===
      0
    ) {
      return "At least one technology is required.";
    }

    if (
      form.status !==
        "completed" &&
      form.status !==
        "in-progress" &&
      form.status !==
        "planned"
    ) {
      return "Please select a valid project status.";
    }

    if (
      form.projectType !==
        "individual" &&
      form.projectType !==
        "team"
    ) {
      return "Please select a valid project type.";
    }

    if (
      form.projectType ===
      "team"
    ) {
      const teamSize =
        Number(
          form.teamSize
        );

      if (
        !Number.isFinite(
          teamSize
        ) ||
        teamSize < 2
      ) {
        return "Team project must have a team size of at least 2.";
      }
    }

    if (
      form.startDate &&
      form.endDate &&
      new Date(
        form.endDate
      ) <
        new Date(
          form.startDate
        )
    ) {
      return "End date cannot be earlier than start date.";
    }

    if (
      form.githubUrl &&
      !validateHttpUrl(
        form.githubUrl
      )
    ) {
      return "GitHub URL must be a valid HTTP/HTTPS URL.";
    }

    if (
      form.liveDemoUrl &&
      !validateHttpUrl(
        form.liveDemoUrl
      )
    ) {
      return "Live Demo URL must be a valid HTTP/HTTPS URL.";
    }

    if (
      form.fullDescription.length >
      MAX_FULL_DESCRIPTION_LENGTH
    ) {
      return `Full description cannot exceed ${MAX_FULL_DESCRIPTION_LENGTH} characters.`;
    }

    return null;
  };

  /*
   * ================================================================
   * UPLOAD PROJECT IMAGES
   * ================================================================
   |
   | Selected local images are uploaded separately through:
   |
   | PATCH /api/admin/projects/:projectId/images
   |
   | The backend expects multipart/form-data
   | with the field name: image
   |
   */

  const uploadSelectedProjectImages =
    async (projectId) => {
      if (
        !projectId ||
        imagePreviews.length === 0
      ) {
        return;
      }

      for (
        const imagePreview
        of imagePreviews
      ) {
        const formData =
          new FormData();

        formData.append(
          "image",
          imagePreview.file
        );

        try {
          const response =
            await fetch(
              `${API_BASE_URL}/api/admin/projects/${projectId}/images`,
              {
                method: "PATCH",

                credentials:
                  "include",

                body: formData,
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Unable to upload ${imagePreview.file.name}.`
            );
          }
        } catch (error) {
          throw new Error(
            `${imagePreview.file.name}: ${getErrorMessage(
              error,
              "Unable to upload project image."
            )}`
          );
        }
      }
    };

  /*
   * ================================================================
   * SAVE PROJECT
   * ================================================================
   */

  const saveProject = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      showToast(
        "error",
        validationError
      );

      return;
    }

    try {
      setSaving(true);

      const isEditing =
        Boolean(
          editingProjectId
        );

      const payload = {
        title:
          form.title.trim(),

        shortDescription:
          form.shortDescription.trim(),

        fullDescription:
          form.fullDescription.trim(),

        category:
          form.category.trim(),

        role:
          form.role.trim(),

        technologies:
          form.technologies,

        features:
          form.features,

        /*
         * Existing Cloudinary images are preserved.
         *
         * New local image files are NOT included here.
         * They are uploaded separately through the
         * protected project image endpoint after the
         * project has been created/updated.
         */
        images:
          form.images,

        links:
          form.links.map(
            (
              link,
              index
            ) => ({
              ...link,
              displayOrder:
                index,
            })
          ),

        githubUrl:
          form.githubUrl.trim(),

        liveDemoUrl:
          form.liveDemoUrl.trim(),

        startDate:
          form.startDate ||
          null,

        endDate:
          form.endDate ||
          null,

        status:
          form.status,

        projectType:
          form.projectType,

        teamSize:
          form.projectType ===
          "team"
            ? Number(
                form.teamSize
              )
            : null,

        futureImprovements:
          form.futureImprovements.trim(),

        isVisible:
          form.isVisible,

        isFeatured:
          form.isFeatured,

        displayOrder:
          Number(
            form.displayOrder
          ),

        isActive:
          form.isActive,
      };

      const endpoint =
        isEditing
          ? `${API_BASE_URL}/api/admin/projects/${editingProjectId}`
          : `${API_BASE_URL}/api/admin/projects`;

      const response =
        await fetch(
          endpoint,
          {
            method:
              isEditing
                ? "PUT"
                : "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to ${
              isEditing
                ? "update"
                : "create"
            } project.`
        );
      }

      /*
       * ================================================================
       * UPLOAD NEW PROJECT IMAGES
       * ================================================================
       |
       | The project must exist first because the image
       | endpoint needs the project ID.
       |
       */

      const savedProject =
        data?.project ||
        data?.data ||
        data;

      const savedProjectId =
        getProjectId(
          savedProject
        ) ||
        editingProjectId;

      if (
        imagePreviews.length > 0
      ) {
        if (!savedProjectId) {
          throw new Error(
            "Project was saved, but its ID was not returned. Images could not be uploaded."
          );
        }

        try {
          await uploadSelectedProjectImages(
            savedProjectId
          );

          showToast(
            "success",
            isEditing
              ? "✅ Project and images updated successfully."
              : "🎉 Project and images created successfully."
          );
        } catch (imageUploadError) {
          /*
           * Project data is already saved.
           * Keep the form open so the user can see
           * the upload failure instead of losing context.
           */
          showToast(
            "error",
            `Project saved, but image upload failed. ${getErrorMessage(
              imageUploadError,
              "Please try uploading the images again."
            )}`
          );

          setImagePreviews(
            []
          );

          setDirty(false);

          await fetchProjects();

          return;
        }
      } else {
        showToast(
          "success",
          isEditing
            ? "✅ Project updated successfully."
            : "🎉 Project created successfully."
        );
      }

      setFormOpen(false);

      setEditingProjectId(
        null
      );

      setForm(
        createEmptyForm()
      );

      setImagePreviews(
        []
      );

      setNewTechnology("");

      setNewFeature("");

      setNewLink({
        label: "",
        url: "",
        type: "other",
        visible: true,
      });

      setDirty(false);

      await fetchProjects();
    } catch (error) {
      showToast(
        "error",
        getErrorMessage(
          error,
          "Unable to save project."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ================================================================
   * EDIT PROJECT
   * ================================================================
   */

  const openEditProject =
    async (
      project
    ) => {
      const projectId =
        getProjectId(
          project
        );

      if (!projectId) {
        showToast(
          "error",
          "Project ID is missing."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/projects/${projectId}`,
            {
              method: "GET",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load project."
          );
        }

        const loadedProject =
          data?.project ||
          data?.data ||
          data;

        setForm(
          normalizeProjectForForm(
            loadedProject
          )
        );

        setEditingProjectId(
          projectId
        );

        setFormOpen(true);

        setDirty(false);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        showToast(
          "error",
          getErrorMessage(
            error,
            "Unable to load project."
          )
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * ================================================================
   * NEW PROJECT
   * ================================================================
   */

  const openNewProject =
    () => {
      setEditingProjectId(
        null
      );

      setForm(
        createEmptyForm()
      );

      setImagePreviews(
        []
      );

      setNewTechnology("");

      setNewFeature("");

      setNewLink({
        label: "",
        url: "",
        type: "other",
        visible: true,
      });

      setDirty(false);

      setFormOpen(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /*
   * ================================================================
   * CANCEL FORM
   * ================================================================
   */

  const cancelForm = () => {
    if (dirty) {
      setConfirmDialog({
        title:
          "Discard Changes?",
        message:
          "You have unsaved project changes. Are you sure you want to leave them?",
        confirmLabel:
          "Discard Changes",
        danger: true,
        onConfirm: () => {
          setFormOpen(false);

          setEditingProjectId(
            null
          );

          setForm(
            createEmptyForm()
          );

          setImagePreviews(
            []
          );

          setDirty(false);

          setConfirmDialog(
            null
          );
        },
      });

      return;
    }

    setFormOpen(false);

    setEditingProjectId(
      null
    );

    setForm(
      createEmptyForm()
    );
  };

  /*
   * ================================================================
   * DELETE PROJECT
   * ================================================================
   */

  const requestDeleteProject =
    (
      project
    ) => {
      const projectId =
        getProjectId(
          project
        );

      if (!projectId) {
        showToast(
          "error",
          "Project ID is missing."
        );

        return;
      }

      setConfirmDialog({
        title:
          "Delete Project?",
        message:
          `This will permanently delete "${project.title}". This action cannot be undone.`,
        confirmLabel:
          "Delete Project",
        danger: true,
        onConfirm:
          () =>
            deleteProject(
              projectId
            ),
      });
    };

  const deleteProject =
    async (
      projectId
    ) => {
      try {
        setDeletingId(
          projectId
        );

        setConfirmDialog(
          null
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/projects/${projectId}`,
            {
              method: "DELETE",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to delete project."
          );
        }

        showToast(
          "success",
          "🗑️ Project deleted successfully."
        );

        await fetchProjects();
      } catch (error) {
        showToast(
          "error",
          getErrorMessage(
            error,
            "Unable to delete project."
          )
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  /*
   * ================================================================
   * DISPLAY TOGGLE
   * ================================================================
   */

  const toggleProjectSetting =
    async (
      project,
      field,
      endpointName
    ) => {
      const projectId =
        getProjectId(
          project
        );

      if (!projectId) {
        return;
      }

      const nextValue =
        !Boolean(
          project[field]
        );

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/projects/${projectId}/${endpointName}`,
            {
              method: "PATCH",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body: JSON.stringify({
                [field]:
                  nextValue,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to update ${field}.`
          );
        }

        setProjects(
          (previous) =>
            previous.map(
              (item) =>
                getProjectId(
                  item
                ) ===
                projectId
                  ? {
                      ...item,
                      [field]:
                        nextValue,
                    }
                  : item
            )
        );

        showToast(
          "success",
          nextValue
            ? "✅ Setting enabled."
            : "ℹ️ Setting disabled."
        );
      } catch (error) {
        showToast(
          "error",
          getErrorMessage(
            error,
            `Unable to update ${field}.`
          )
        );
      }
    };

  /*
   * ================================================================
   * PROJECT STATUS
   * ================================================================
   */

  const changeProjectStatus =
    async (
      project,
      status
    ) => {
      const projectId =
        getProjectId(
          project
        );

      if (!projectId) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/projects/${projectId}/status`,
            {
              method: "PATCH",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body: JSON.stringify({
                status,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to update project status."
          );
        }

        setProjects(
          (previous) =>
            previous.map(
              (item) =>
                getProjectId(
                  item
                ) ===
                projectId
                  ? {
                      ...item,
                      status,
                    }
                  : item
            )
        );

        showToast(
          "success",
          "✅ Project status updated."
        );
      } catch (error) {
        showToast(
          "error",
          getErrorMessage(
            error,
            "Unable to update project status."
          )
        );
      }
    };

  /*
   * ================================================================
   * SORTED PROJECTS
   * ================================================================
   */

  const sortedProjects =
    useMemo(() => {
      return [
        ...projects,
      ].sort(
        (a, b) => {
          const orderDifference =
            Number(
              a.displayOrder ||
                0
            ) -
            Number(
              b.displayOrder ||
                0
            );

          if (
            orderDifference !==
            0
          ) {
            return orderDifference;
          }

          return (
            new Date(
              b.createdAt ||
                0
            ).getTime() -
            new Date(
              a.createdAt ||
                0
            ).getTime()
          );
        }
      );
    }, [projects]);

  /*
   * ================================================================
   * RENDER
   * ================================================================
   */

  return (
    <div className="admin-projects-page">
      {/* ============================================================
          LOCAL TOAST
          ============================================================ */}

      {toast && (
        <div
          className={`admin-projects-toast admin-projects-toast-${toast.type}`}
          role="alert"
        >
          <span>
            {toast.message}
          </span>

          <button
            type="button"
            onClick={() =>
              setToast(null)
            }
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* ============================================================
          CONFIRMATION MODAL
          ============================================================ */}

      {confirmDialog && (
        <div
          className="admin-projects-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setConfirmDialog(
                null
              );
            }
          }}
        >
          <div
            className="admin-projects-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-confirm-title"
          >
            <div className="admin-projects-confirm-icon">
              {confirmDialog.danger
                ? "⚠️"
                : "❔"}
            </div>

            <h3 id="project-confirm-title">
              {
                confirmDialog.title
              }
            </h3>

            <p>
              {
                confirmDialog.message
              }
            </p>

            <div className="admin-projects-confirm-actions">
              <button
                type="button"
                className="admin-projects-secondary-btn"
                onClick={() =>
                  setConfirmDialog(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmDialog.danger
                    ? "admin-projects-danger-btn"
                    : "admin-projects-primary-btn"
                }
                onClick={
                  confirmDialog.onConfirm
                }
              >
                {
                  confirmDialog.confirmLabel
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          HEADER
          ============================================================ */}

      <header className="admin-projects-header">
        <div className="admin-projects-header-left">
          <button
            type="button"
            className="admin-projects-back-btn"
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
            aria-label="Back to dashboard"
          >
            ←
          </button>

          <div>
            <span className="admin-projects-eyebrow">
              Portfolio CMS
            </span>

            <h1>
              Projects
            </h1>

            <p>
              Manage your portfolio
              projects, technologies,
              links, images and
              visibility.
            </p>
          </div>
        </div>

        {!formOpen && (
          <button
            type="button"
            className="admin-projects-primary-btn admin-projects-add-btn"
            onClick={
              openNewProject
            }
          >
            + Add Project
          </button>
        )}
      </header>

      {/* ============================================================
          FORM
          ============================================================ */}

      {formOpen && (
        <section className="admin-projects-form-card">
          <div className="admin-projects-form-header">
            <div>
              <span className="admin-projects-section-label">
                {editingProjectId
                  ? "EDIT PROJECT"
                  : "NEW PROJECT"}
              </span>

              <h2>
                {editingProjectId
                  ? "Update Project"
                  : "Create Project"}
              </h2>

              <p>
                Required fields are
                marked with *
              </p>
            </div>

            <button
              type="button"
              className="admin-projects-secondary-btn"
              onClick={
                cancelForm
              }
            >
              ← Back
            </button>
          </div>

          <form
            className="admin-projects-form"
            onSubmit={
              saveProject
            }
          >
            {/* ======================================================
                BASIC INFORMATION
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Basic Information
                </h3>

                <p>
                  Core information
                  about your project.
                </p>
              </div>

              <div className="admin-projects-grid">
                <div className="admin-projects-field admin-projects-field-full">
                  <label htmlFor="project-title">
                    Project Title *
                  </label>

                  <input
                    id="project-title"
                    name="title"
                    type="text"
                    value={
                      form.title
                    }
                    onChange={
                      handleFieldChange
                    }
                    maxLength={
                      MAX_TITLE_LENGTH
                    }
                    placeholder="e.g. AromaTrace"
                    required
                  />

                  <span className="admin-projects-counter">
                    {
                      form.title
                        .length
                    }{" "}
                    /{" "}
                    {
                      MAX_TITLE_LENGTH
                    }
                  </span>
                </div>

                <div className="admin-projects-field admin-projects-field-full">
                  <label htmlFor="project-short-description">
                    Short Description *
                  </label>

                  <textarea
                    id="project-short-description"
                    name="shortDescription"
                    value={
                      form.shortDescription
                    }
                    onChange={
                      handleFieldChange
                    }
                    maxLength={
                      MAX_SHORT_DESCRIPTION_LENGTH
                    }
                    rows="3"
                    placeholder="Briefly describe what this project does..."
                    required
                  />

                  <span className="admin-projects-counter">
                    {
                      form
                        .shortDescription
                        .length
                    }{" "}
                    /{" "}
                    {
                      MAX_SHORT_DESCRIPTION_LENGTH
                    }
                  </span>
                </div>

                <div className="admin-projects-field">
                  <label htmlFor="project-category">
                    Category *
                  </label>

                  <input
                    id="project-category"
                    name="category"
                    type="text"
                    value={
                      form.category
                    }
                    onChange={
                      handleFieldChange
                    }
                    maxLength={
                      MAX_CATEGORY_LENGTH
                    }
                    placeholder="e.g. Full Stack Development"
                    required
                  />
                </div>

                <div className="admin-projects-field">
                  <label htmlFor="project-role">
                    Your Role
                  </label>

                  <input
                    id="project-role"
                    name="role"
                    type="text"
                    value={
                      form.role
                    }
                    onChange={
                      handleFieldChange
                    }
                    maxLength={
                      MAX_ROLE_LENGTH
                    }
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>

                <div className="admin-projects-field admin-projects-field-full">
                  <label htmlFor="project-full-description">
                    Full Description
                  </label>

                  <textarea
                    id="project-full-description"
                    name="fullDescription"
                    value={
                      form.fullDescription
                    }
                    onChange={
                      handleFieldChange
                    }
                    maxLength={
                      MAX_FULL_DESCRIPTION_LENGTH
                    }
                    rows="6"
                    placeholder="Provide a detailed explanation of the project..."
                  />

                  <span className="admin-projects-counter">
                    {
                      form
                        .fullDescription
                        .length
                    }{" "}
                    /{" "}
                    {
                      MAX_FULL_DESCRIPTION_LENGTH
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* ======================================================
                TECHNOLOGIES
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Technologies *
                </h3>

                <p>
                  Add every major
                  technology used in
                  this project.
                </p>
              </div>

              <div className="admin-projects-inline-add">
                <input
                  type="text"
                  value={
                    newTechnology
                  }
                  onChange={(event) =>
                    setNewTechnology(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      addTechnology();
                    }
                  }}
                  placeholder="e.g. React"
                />

                <button
                  type="button"
                  className="admin-projects-secondary-btn"
                  onClick={
                    addTechnology
                  }
                >
                  + Add
                </button>
              </div>

              {form.technologies
                .length > 0 ? (
                <div className="admin-projects-chip-list">
                  {form.technologies.map(
                    (
                      technology,
                      index
                    ) => (
                      <span
                        className="admin-projects-chip"
                        key={`${technology}-${index}`}
                      >
                        {technology}

                        <button
                          type="button"
                          onClick={() =>
                            removeTechnology(
                              index
                            )
                          }
                          aria-label={`Remove ${technology}`}
                        >
                          ×
                        </button>
                      </span>
                    )
                  )}
                </div>
              ) : (
                <div className="admin-projects-empty-inline">
                  ⚠️ Add at least one
                  technology.
                </div>
              )}
            </div>

            {/* ======================================================
                FEATURES
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Features
                </h3>

                <p>
                  Add important
                  features or
                  capabilities.
                </p>
              </div>

              <div className="admin-projects-inline-add">
                <input
                  type="text"
                  value={
                    newFeature
                  }
                  onChange={(event) =>
                    setNewFeature(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      addFeature();
                    }
                  }}
                  placeholder="e.g. JWT Authentication"
                />

                <button
                  type="button"
                  className="admin-projects-secondary-btn"
                  onClick={
                    addFeature
                  }
                >
                  + Add
                </button>
              </div>

              {form.features
                .length > 0 && (
                <div className="admin-projects-dynamic-list">
                  {form.features.map(
                    (
                      feature,
                      index
                    ) => (
                      <div
                        className="admin-projects-dynamic-row"
                        key={`${feature}-${index}`}
                      >
                        <span>
                          {index +
                            1}
                          .
                        </span>

                        <div>
                          {
                            feature
                          }
                        </div>

                        <button
                          type="button"
                          className="admin-projects-icon-danger"
                          onClick={() =>
                            removeFeature(
                              index
                            )
                          }
                          aria-label="Remove feature"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* ======================================================
                PROJECT IMAGES
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Project Images
                </h3>

                <p>
                  Upload multiple
                  screenshots. Images
                  will keep their
                  original aspect ratio
                  without cropping or
                  stretching.
                </p>
              </div>

              <div className="admin-projects-upload-box">
                <input
                  ref={
                    imageInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={
                    handleImageSelection
                  }
                  hidden
                />

                <button
                  type="button"
                  className="admin-projects-upload-btn"
                  onClick={() =>
                    imageInputRef.current?.click()
                  }
                >
                  🖼️ Choose Project Images
                </button>

                <p>
                  JPG, PNG or WEBP •
                  Maximum 10 MB per
                  image • Up to 20
                  images
                </p>
              </div>

              {imagePreviews
                .length > 0 && (
                <div className="admin-projects-image-grid">
                  {imagePreviews.map(
                    (
                      image
                    ) => (
                      <div
                        className="admin-projects-image-card"
                        key={
                          image.tempId
                        }
                      >
                        <div className="admin-projects-image-preview">
                          <img
                            src={
                              image.previewUrl
                            }
                            alt={
                              image.file
                                .name
                            }
                          />
                        </div>

                        <div className="admin-projects-image-meta">
                          <strong>
                            {
                              image.file
                                .name
                            }
                          </strong>

                          <span>
                            {
                              image.width
                            }{" "}
                            ×{" "}
                            {
                              image.height
                            }{" "}
                            px
                          </span>
                        </div>

                        <button
                          type="button"
                          className="admin-projects-image-remove"
                          onClick={() =>
                            removeImagePreview(
                              image.tempId
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {form.images
                .length > 0 && (
                <div className="admin-projects-existing-images">
                  <div className="admin-projects-existing-title">
                    Existing Images
                  </div>

                  <div className="admin-projects-image-grid">
                    {form.images.map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          className="admin-projects-image-card"
                          key={
                            image.id ||
                            image._id ||
                            `${image.url}-${index}`
                          }
                        >
                          <div className="admin-projects-image-preview">
                            <img
                              src={
                                image.url
                              }
                              alt={
                                image.originalName ||
                                `Project image ${
                                  index +
                                  1
                                }`
                              }
                            />
                          </div>

                          <div className="admin-projects-image-meta">
                            <strong>
                              {
                                image.originalName
                              }
                            </strong>

                            {image.width &&
                              image.height && (
                                <span>
                                  {
                                    image.width
                                  }{" "}
                                  ×{" "}
                                  {
                                    image.height
                                  }{" "}
                                  px
                                </span>
                              )}
                          </div>

                          <button
                            type="button"
                            className="admin-projects-image-remove"
                            onClick={() =>
                              requestDeleteExistingProjectImage(
                                image
                              )
                            }
                            disabled={
                              saving
                            }
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {imagePreviews
                .length > 0 && (
                <div className="admin-projects-image-info">
                  ℹ️ Selected images are
                  previewed locally and
                  will be uploaded to
                  Cloudinary when you save
                  the project. Existing
                  images can be removed
                  using the Remove button.
                </div>
              )}
            </div>

            {/* ======================================================
                LINKS
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Project Links
                </h3>

                <p>
                  GitHub, live demo and
                  other professional
                  links.
                </p>
              </div>

              <div className="admin-projects-link-builder">
                <div className="admin-projects-grid">
                  <div className="admin-projects-field">
                    <label htmlFor="new-link-label">
                      Link Label
                    </label>

                    <input
                      id="new-link-label"
                      name="label"
                      type="text"
                      value={
                        newLink.label
                      }
                      onChange={
                        handleNewLinkChange
                      }
                      maxLength="60"
                      placeholder="e.g. GitHub"
                    />
                  </div>

                  <div className="admin-projects-field">
                    <label htmlFor="new-link-type">
                      Link Type
                    </label>

                    <select
                      id="new-link-type"
                      name="type"
                      value={
                        newLink.type
                      }
                      onChange={
                        handleNewLinkChange
                      }
                    >
                      <option value="github">
                        GitHub
                      </option>

                      <option value="live">
                        Live Demo
                      </option>

                      <option value="other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div className="admin-projects-field admin-projects-field-full">
                    <label htmlFor="new-link-url">
                      URL
                    </label>

                    <input
                      id="new-link-url"
                      name="url"
                      type="url"
                      value={
                        newLink.url
                      }
                      onChange={
                        handleNewLinkChange
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <label className="admin-projects-checkbox-row">
                  <input
                    type="checkbox"
                    name="visible"
                    checked={
                      newLink.visible
                    }
                    onChange={
                      handleNewLinkChange
                    }
                  />

                  <span>
                    Show this link
                    publicly
                  </span>
                </label>

                <button
                  type="button"
                  className="admin-projects-secondary-btn"
                  onClick={
                    addLink
                  }
                >
                  + Add Link
                </button>
              </div>

              {form.links
                .length > 0 && (
                <div className="admin-projects-links-list">
                  {form.links.map(
                    (
                      link,
                      index
                    ) => (
                      <div
                        className="admin-projects-link-row"
                        key={
                          link._id ||
                          `${link.label}-${index}`
                        }
                      >
                        <div className="admin-projects-link-info">
                          <strong>
                            {
                              link.label
                            }
                          </strong>

                          <span>
                            {
                              link.url
                            }
                          </span>

                          <small>
                            {
                              link.type
                            }
                          </small>
                        </div>

                        <div className="admin-projects-link-actions">
                          <button
                            type="button"
                            className="admin-projects-small-btn"
                            onClick={() =>
                              toggleLinkVisibility(
                                index
                              )
                            }
                          >
                            {link.visible
                              ? "Visible"
                              : "Hidden"}
                          </button>

                          <button
                            type="button"
                            className="admin-projects-icon-danger"
                            onClick={() =>
                              removeLink(
                                index
                              )
                            }
                            aria-label="Remove link"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* ======================================================
                DATES + STATUS
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Project Details
                </h3>

                <p>
                  Timeline, status and
                  project type.
                </p>
              </div>

              <div className="admin-projects-grid">
                <div className="admin-projects-field">
                  <label htmlFor="project-start-date">
                    Start Date
                  </label>

                  <input
                    id="project-start-date"
                    name="startDate"
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleFieldChange
                    }
                  />
                </div>

                <div className="admin-projects-field">
                  <label htmlFor="project-end-date">
                    End Date
                  </label>

                  <input
                    id="project-end-date"
                    name="endDate"
                    type="date"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleFieldChange
                    }
                  />
                </div>

                <div className="admin-projects-field">
                  <label htmlFor="project-status">
                    Status *
                  </label>

                  <select
                    id="project-status"
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleFieldChange
                    }
                    required
                  >
                    <option value="completed">
                      Completed
                    </option>

                    <option value="in-progress">
                      In Progress
                    </option>

                    <option value="planned">
                      Planned
                    </option>
                  </select>
                </div>

                <div className="admin-projects-field">
                  <label htmlFor="project-type">
                    Project Type *
                  </label>

                  <select
                    id="project-type"
                    name="projectType"
                    value={
                      form.projectType
                    }
                    onChange={
                      handleFieldChange
                    }
                    required
                  >
                    <option value="individual">
                      Individual
                    </option>

                    <option value="team">
                      Team
                    </option>
                  </select>
                </div>

                {form.projectType ===
                  "team" && (
                  <div className="admin-projects-field">
                    <label htmlFor="project-team-size">
                      Team Size *
                    </label>

                    <input
                      id="project-team-size"
                      name="teamSize"
                      type="number"
                      min="2"
                      step="1"
                      value={
                        form.teamSize
                      }
                      onChange={
                        handleFieldChange
                      }
                      placeholder="e.g. 4"
                      required
                    />
                  </div>
                )}

                <div className="admin-projects-field">
                  <label htmlFor="project-display-order">
                    Display Order
                  </label>

                  <input
                    id="project-display-order"
                    name="displayOrder"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.displayOrder
                    }
                    onChange={
                      handleFieldChange
                    }
                  />
                </div>
              </div>
            </div>

            {/* ======================================================
                LINKS SHORTCUTS
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Quick Project URLs
                </h3>

                <p>
                  Optional direct GitHub
                  and Live Demo URLs.
                </p>
              </div>

              <div className="admin-projects-grid">
                <div className="admin-projects-field">
                  <label htmlFor="project-github-url">
                    GitHub URL
                  </label>

                  <input
                    id="project-github-url"
                    name="githubUrl"
                    type="url"
                    value={
                      form.githubUrl
                    }
                    onChange={
                      handleFieldChange
                    }
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="admin-projects-field">
                  <label htmlFor="project-live-url">
                    Live Demo URL
                  </label>

                  <input
                    id="project-live-url"
                    name="liveDemoUrl"
                    type="url"
                    value={
                      form.liveDemoUrl
                    }
                    onChange={
                      handleFieldChange
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* ======================================================
                FUTURE IMPROVEMENTS
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Future Improvements
                </h3>

                <p>
                  Optional plans for
                  future versions.
                </p>
              </div>

              <textarea
                name="futureImprovements"
                value={
                  form.futureImprovements
                }
                onChange={
                  handleFieldChange
                }
                maxLength="2000"
                rows="5"
                placeholder="Describe possible future improvements..."
              />
            </div>

            {/* ======================================================
                DISPLAY SETTINGS
                ====================================================== */}

            <div className="admin-projects-form-section">
              <div className="admin-projects-section-heading">
                <h3>
                  Display Settings
                </h3>

                <p>
                  Control how this
                  project behaves on the
                  public portfolio.
                </p>
              </div>

              <div className="admin-projects-settings-grid">
                <label className="admin-projects-setting-card">
                  <input
                    type="checkbox"
                    name="isVisible"
                    checked={
                      form.isVisible
                    }
                    onChange={
                      handleFieldChange
                    }
                  />

                  <span>
                    <strong>
                      Publicly Visible
                    </strong>

                    <small>
                      Show this project
                      on the public
                      portfolio.
                    </small>
                  </span>
                </label>

                <label className="admin-projects-setting-card">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={
                      form.isFeatured
                    }
                    onChange={
                      handleFieldChange
                    }
                  />

                  <span>
                    <strong>
                      Featured Project
                    </strong>

                    <small>
                      Mark this project
                      as featured.
                    </small>
                  </span>
                </label>

                <label className="admin-projects-setting-card">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      form.isActive
                    }
                    onChange={
                      handleFieldChange
                    }
                  />

                  <span>
                    <strong>
                      Active
                    </strong>

                    <small>
                      Keep this project
                      active in CMS.
                    </small>
                  </span>
                </label>
              </div>
            </div>

            {/* ======================================================
                FORM ACTIONS
                ====================================================== */}

            <div className="admin-projects-form-actions">
              <button
                type="button"
                className="admin-projects-secondary-btn"
                onClick={
                  cancelForm
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-projects-primary-btn"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : editingProjectId
                    ? "💾 Update Project"
                    : "🚀 Create Project"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ============================================================
          PROJECT LIST
          ============================================================ */}

      {!formOpen && (
        <section className="admin-projects-list-section">
          <div className="admin-projects-list-header">
            <div>
              <span className="admin-projects-section-label">
                PROJECT LIBRARY
              </span>

              <h2>
                Your Projects
              </h2>

              <p>
                {projects.length}{" "}
                project
                {projects.length ===
                1
                  ? ""
                  : "s"}{" "}
                in the portfolio
                CMS.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="admin-projects-loading">
              <div className="admin-projects-spinner" />

              <p>
                Loading projects...
              </p>
            </div>
          ) : sortedProjects.length ===
            0 ? (
            <div className="admin-projects-empty">
              <div className="admin-projects-empty-icon">
                🚀
              </div>

              <h3>
                No Projects Yet
              </h3>

              <p>
                Start building your
                portfolio by adding
                your first project.
              </p>

              <button
                type="button"
                className="admin-projects-primary-btn"
                onClick={
                  openNewProject
                }
              >
                + Add Your First
                Project
              </button>
            </div>
          ) : (
            <div className="admin-projects-cards">
              {sortedProjects.map(
                (
                  project
                ) => {
                  const projectId =
                    getProjectId(
                      project
                    );

                  const primaryImage =
                    Array.isArray(
                      project.images
                    )
                      ? project.images.find(
                          (
                            image
                          ) =>
                            image.isPrimary
                        ) ||
                        project.images[0]
                      : null;

                  return (
                    <article
                      className="admin-project-card"
                      key={
                        projectId
                      }
                    >
                      <div className="admin-project-card-image">
                        {primaryImage?.url ? (
                          <img
                            src={
                              primaryImage.url
                            }
                            alt={
                              project.title
                            }
                          />
                        ) : (
                          <div className="admin-project-card-no-image">
                            <span>
                              🖼️
                            </span>

                            <small>
                              No project
                              image
                            </small>
                          </div>
                        )}

                        <div className="admin-project-card-badges">
                          {project.isFeatured && (
                            <span className="admin-project-badge admin-project-badge-featured">
                              ⭐ Featured
                            </span>
                          )}

                          <span
                            className={`admin-project-badge admin-project-badge-${project.status}`}
                          >
                            {project.status ===
                            "in-progress"
                              ? "In Progress"
                              : project.status ===
                                  "completed"
                                ? "Completed"
                                : "Planned"}
                          </span>
                        </div>
                      </div>

                      <div className="admin-project-card-content">
                        <div className="admin-project-card-top">
                          <div>
                            <span className="admin-project-card-category">
                              {
                                project.category
                              }
                            </span>

                            <h3>
                              {
                                project.title
                              }
                            </h3>
                          </div>

                          <span className="admin-project-card-order">
                            #
                            {
                              project.displayOrder
                            }
                          </span>
                        </div>

                        <p className="admin-project-card-description">
                          {
                            project.shortDescription
                          }
                        </p>

                        {Array.isArray(
                          project.technologies
                        ) &&
                          project
                            .technologies
                            .length >
                            0 && (
                            <div className="admin-project-card-tech">
                              {project.technologies
                                .slice(
                                  0,
                                  6
                                )
                                .map(
                                  (
                                    technology,
                                    index
                                  ) => (
                                    <span
                                      key={`${technology}-${index}`}
                                    >
                                      {
                                        technology
                                      }
                                    </span>
                                  )
                                )}

                              {project
                                .technologies
                                .length >
                                6 && (
                                <span>
                                  +
                                  {project
                                    .technologies
                                    .length -
                                    6}
                                </span>
                              )}
                            </div>
                          )}

                        <div className="admin-project-card-meta">
                          <span>
                            {project.projectType ===
                            "team"
                              ? `👥 Team${
                                  project.teamSize
                                    ? ` · ${project.teamSize}`
                                    : ""
                                }`
                              : "👤 Individual"}
                          </span>

                          <span>
                            🖼️{" "}
                            {
                              (
                                project
                                  .images ||
                                []
                              ).length
                            }
                          </span>
                        </div>

                        <div className="admin-project-card-controls">
                          <button
                            type="button"
                            className="admin-project-control-btn"
                            onClick={() =>
                              toggleProjectSetting(
                                project,
                                "isVisible",
                                "visibility"
                              )
                            }
                          >
                            {project.isVisible
                              ? "👁️ Visible"
                              : "🙈 Hidden"}
                          </button>

                          <button
                            type="button"
                            className="admin-project-control-btn"
                            onClick={() =>
                              toggleProjectSetting(
                                project,
                                "isFeatured",
                                "featured"
                              )
                            }
                          >
                            {project.isFeatured
                              ? "⭐ Featured"
                              : "☆ Feature"}
                          </button>

                          <button
                            type="button"
                            className="admin-project-control-btn"
                            onClick={() =>
                              toggleProjectSetting(
                                project,
                                "isActive",
                                "status"
                              )
                            }
                          >
                            {project.isActive
                              ? "● Active"
                              : "○ Inactive"}
                          </button>
                        </div>

                        <div className="admin-project-card-status">
                          <label>
                            Status
                          </label>

                          <select
                            value={
                              project.status ||
                              "completed"
                            }
                            onChange={(
                              event
                            ) =>
                              changeProjectStatus(
                                project,
                                event
                                  .target
                                  .value
                              )
                            }
                          >
                            <option value="completed">
                              Completed
                            </option>

                            <option value="in-progress">
                              In Progress
                            </option>

                            <option value="planned">
                              Planned
                            </option>
                          </select>
                        </div>

                        <div className="admin-project-card-actions">
                          <button
                            type="button"
                            className="admin-projects-secondary-btn"
                            onClick={() =>
                              openEditProject(
                                project
                              )
                            }
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            className="admin-projects-danger-btn"
                            onClick={() =>
                              requestDeleteProject(
                                project
                              )
                            }
                            disabled={
                              deletingId ===
                              projectId
                            }
                          >
                            {deletingId ===
                            projectId
                              ? "Deleting..."
                              : "🗑️ Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminProjects;