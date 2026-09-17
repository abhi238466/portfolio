import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  ArrowLeft,
  AtSign,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import {
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";

import "./AdminProfile.css";

/*
|--------------------------------------------------------------------------
| Admin Profile Management
|--------------------------------------------------------------------------
|
| Responsibilities:
| - Manage professional identity
| - Manage profile photo
| - Manage contact information
| - Manage social/professional links
| - Manage resume
| - Manage public visibility preferences
|
| Important:
| - Actual persistence will be connected to the backend API later.
| - Profile photos will eventually be uploaded to persistent cloud storage.
| - Personal portfolio content is NOT hardcoded.
|
*/

const EMPTY_PROFILE = {
  name: "",
  headline: "",
  shortBio: "",
  email: "",
  phone: "",
  currentAddress: "",
  permanentAddress: "",
};

const EMPTY_VISIBILITY = {
  email: true,
  phone: true,
  currentAddress: false,
  permanentAddress: false,
};

const EMPTY_LINK = {
  id: "",
  serverId: "",
  label: "",
  url: "",
  type: "other",
  visible: true,
  displayOrder: 0,
};

const EMPTY_EDIT_LINK = {
  id: "",
  serverId: "",
  label: "",
  url: "",
  type: "other",
  visible: true,
  displayOrder: 0,
};

/*
|--------------------------------------------------------------------------
| FILE VALIDATION CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_PROFILE_PHOTO_SIZE =
  10 * 1024 * 1024; // 10 MB

const PROFILE_PHOTO_MAX_SIZE_LABEL =
  "10 MB";

const PROFILE_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_RESUME_SIZE =
  10 * 1024 * 1024; // 10 MB

const RESUME_ALLOWED_TYPES = [
  "application/pdf",
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const SOCIAL_LINK_TYPES = [
  {
    value: "github",
    label: "GitHub",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
  },
  {
    value: "email",
    label: "Email",
  },
  {
    value: "website",
    label: "Website",
  },
  {
    value: "other",
    label: "Other",
  },
];

const generateLinkId = () => {
  return `link-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

function AdminProfile() {
  const navigate = useNavigate();

  const profilePhotoInputRef =
    useRef(null);

  const resumeInputRef =
    useRef(null);

  const [profile, setProfile] =
    useState(EMPTY_PROFILE);

  const [visibility, setVisibility] =
    useState(EMPTY_VISIBILITY);

  const [profilePhoto, setProfilePhoto] =
    useState(null);

  const [profilePhotoPreview, setProfilePhotoPreview] =
    useState("");

  const [resume, setResume] =
    useState(null);

  const [hasPersistedResume, setHasPersistedResume] =
    useState(false);

  const [resumeRemovalRequested, setResumeRemovalRequested] =
    useState(false);

  const [resumeVisibility, setResumeVisibility] =
    useState(true);

  const [links, setLinks] =
    useState([]);

  const [isAddingLink, setIsAddingLink] =
    useState(false);

  const [editingLinkId, setEditingLinkId] =
    useState("");

  const [editingLink, setEditingLink] =
    useState(EMPTY_EDIT_LINK);

  const [newLink, setNewLink] =
    useState({
      ...EMPTY_LINK,
      id: generateLinkId(),
    });

  const [isSaving, setIsSaving] =
    useState(false);

  const [isProfileLoaded, setIsProfileLoaded] =
    useState(false);

  const [profileExists, setProfileExists] =
    useState(false);

  const [hasPersistedProfilePhoto, setHasPersistedProfilePhoto] =
    useState(false);

  const [status, setStatus] =
    useState({
      type: "",
      message: "",
    });

  const [confirmAction, setConfirmAction] =
    useState(null);

  const confirmButtonRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | PAGE TITLE + LOAD PROFILE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    document.title =
      "Profile Management | Portfolio CMS";

    return () => {
      document.title =
        "Portfolio CMS";
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setStatus({
          type: "loading",
          message:
            "⏳ Loading your profile...",
        });

        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/profile`,
            {
              method: "GET",
              credentials: "include",
            }
          );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          navigate(
            "/admin/login?auth=required",
            { replace: true }
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load profile."
          );
        }

        if (!mounted) {
          return;
        }

        if (data.profile) {
          const serverProfile =
            data.profile;

          setProfile({
            name:
              serverProfile.name || "",
            headline:
              serverProfile.headline || "",
            shortBio:
              serverProfile.shortBio || "",
            email:
              serverProfile.email || "",
            phone:
              serverProfile.phone || "",
            currentAddress:
              serverProfile.currentAddress || "",
            permanentAddress:
              serverProfile.permanentAddress || "",
          });

          setVisibility({
            ...EMPTY_VISIBILITY,
            ...(serverProfile.visibility || {}),
          });

          setLinks(
            Array.isArray(serverProfile.links)
              ? serverProfile.links.map(
                  (link, index) => ({
                    id:
                      link._id ||
                      generateLinkId(),
                    serverId:
                      link._id || "",
                    label:
                      link.label || "",
                    url:
                      link.url || "",
                    type:
                      link.type || "other",
                    visible:
                      link.visible !== false,
                    displayOrder:
                      Number.isFinite(
                        Number(
                          link.displayOrder
                        )
                      )
                        ? Number(
                            link.displayOrder
                          )
                        : index,
                  })
                )
              : []
          );

          if (
            serverProfile.profilePhoto?.url
          ) {
            setProfilePhotoPreview(
              serverProfile.profilePhoto.url
            );
            setHasPersistedProfilePhoto(
              true
            );
          }

          if (
            serverProfile.resume?.originalName
          ) {
            setResume({
              name:
                serverProfile.resume
                  .originalName,
              size:
                serverProfile.resume.size || 0,
              existing: true,
            });

            setHasPersistedResume(true);
            setResumeRemovalRequested(false);
            setResumeVisibility(
              serverProfile.resume.visible !== false
            );
          } else {
            setResume(null);
            setHasPersistedResume(false);
            setResumeRemovalRequested(false);
            setResumeVisibility(true);
          }

          setProfileExists(true);
        } else {
          setProfileExists(false);
          setLinks([]);
          setProfilePhotoPreview("");
          setHasPersistedProfilePhoto(false);
          setResume(null);
          setHasPersistedResume(false);
          setResumeRemovalRequested(false);
          setResumeVisibility(true);
        }

        setIsProfileLoaded(true);

        setStatus({
          type: "success",
          message: data.profile
            ? "👤 Profile loaded successfully."
            : "🔔 No profile exists yet. You can create it from this page.",
        });
      } catch (error) {
        console.error(
          "Load admin profile error:",
          error
        );

        if (!mounted) {
          return;
        }

        setIsProfileLoaded(true);

        setStatus({
          type: "error",
          message:
            error.message ||
            "❌ Failed to load profile.",
        });
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | CLEANUP PROFILE PHOTO PREVIEW
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (
        profilePhotoPreview &&
        profilePhotoPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          profilePhotoPreview
        );
      }
    };
  }, [profilePhotoPreview]);

  /*
|--------------------------------------------------------------------------
| AUTO DISMISS TEMPORARY TOAST
|--------------------------------------------------------------------------
*/

useEffect(() => {
  if (
    !status.message ||
    status.type === "loading"
  ) {
    return undefined;
  }

  const timer = window.setTimeout(() => {
    setStatus({
      type: "",
      message: "",
    });
  }, 4000);

  return () => {
    window.clearTimeout(timer);
  };
}, [status.message, status.type]);

  /*
  |--------------------------------------------------------------------------
  | PROFILE FIELD CHANGE
  |--------------------------------------------------------------------------
  */

  const handleProfileChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfile(
      (currentProfile) => ({
        ...currentProfile,
        [name]: value,
      })
    );

    clearTemporaryStatus();
  };

  /*
  |--------------------------------------------------------------------------
  | VISIBILITY CHANGE
  |--------------------------------------------------------------------------
  */

  const handleVisibilityChange = (
    field
  ) => {
    setVisibility(
      (currentVisibility) => ({
        ...currentVisibility,
        [field]:
          !currentVisibility[field],
      })
    );

    clearTemporaryStatus();
  };

  /*
  |--------------------------------------------------------------------------
  | PROFILE PHOTO SELECT
  |--------------------------------------------------------------------------
  */

  const handleProfilePhotoChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Frontend validation:
     * - JPG / JPEG
     * - PNG
     * - WEBP
     * - Maximum 10 MB
     *
     * Backend validation will also enforce
     * the same restrictions.
     */

    if (
      !PROFILE_PHOTO_ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Please choose a JPG, JPEG, PNG or WEBP image.",
      });

      event.target.value = "";
      return;
    }

    if (
      file.size >
      MAX_PROFILE_PHOTO_SIZE
    ) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Profile photo must be 10 MB or smaller.",
      });

      event.target.value = "";
      return;
    }

    /*
     * Release the previous temporary
     * browser preview before creating
     * a new one.
     */

    if (
      profilePhotoPreview &&
      profilePhotoPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        profilePhotoPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setProfilePhoto(file);
    setProfilePhotoPreview(
      previewUrl
    );

    setStatus({
      type: "success",
      message:
        "🖼️ Profile photo selected. Save changes to apply it.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE PROFILE PHOTO
  |--------------------------------------------------------------------------
  */

  const handleRemoveProfilePhoto = () => {
    if (!profilePhotoPreview) {
      return;
    }

    setConfirmAction({
      title: "Remove profile photo?",
      message:
        "The current profile photo will be removed when you save the profile changes.",
      confirmLabel:
        "Remove photo",
      danger: true,
      onConfirm: () => {
        if (
          profilePhotoPreview &&
          profilePhotoPreview.startsWith("blob:")
        ) {
          URL.revokeObjectURL(
            profilePhotoPreview
          );
        }

        setProfilePhoto(null);
        setProfilePhotoPreview("");

        if (
          profilePhotoInputRef.current
        ) {
          profilePhotoInputRef.current.value =
            "";
        }

        setStatus({
          type: "info",
          message:
            "🖼️ Profile photo removal is pending. Save changes to apply it.",
        });
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | RESUME SELECT
  |--------------------------------------------------------------------------
  */

  const handleResumeChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !RESUME_ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Please choose a PDF resume.",
      });

      event.target.value = "";
      return;
    }

    if (
      file.size >
      MAX_RESUME_SIZE
    ) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Resume must be 10 MB or smaller.",
      });

      event.target.value = "";
      return;
    }

    setResume(file);
    setResumeRemovalRequested(false);

    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }

    setStatus({
      type: "success",
      message:
        "📄 Resume selected. Save changes to upload it.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN RESUME
  |--------------------------------------------------------------------------
  */

  const handleOpenResume = () => {
    if (!resume) {
      return;
    }

    if (resume instanceof File) {
      const previewUrl =
        URL.createObjectURL(resume);

      window.open(
        previewUrl,
        "_blank",
        "noopener,noreferrer"
      );

      window.setTimeout(() => {
        URL.revokeObjectURL(
          previewUrl
        );
      }, 60 * 1000);

      return;
    }

    window.open(
      `${API_BASE_URL}/api/admin/profile/resume`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE RESUME
  |--------------------------------------------------------------------------
  */

  const requestRemoveResume = () => {
    if (!resume) {
      return;
    }

    setConfirmAction({
      title: "Remove resume?",
      message:
        "The current resume will be removed when you save the profile changes.",
      confirmLabel: "Remove resume",
      danger: true,
      onConfirm: () => {
        setResume(null);
        setResumeRemovalRequested(
          hasPersistedResume
        );

        if (resumeInputRef.current) {
          resumeInputRef.current.value =
            "";
        }

        setStatus({
          type: "info",
          message:
            "📄 Resume removal is pending. Save changes to apply it.",
        });
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | RESUME VISIBILITY
  |--------------------------------------------------------------------------
  */

  const handleResumeVisibilityChange = () => {
    setResumeVisibility(
      (currentValue) =>
        !currentValue
    );

    clearTemporaryStatus();
  };

  /*
  |--------------------------------------------------------------------------
  | NEW LINK FIELD CHANGE
  |--------------------------------------------------------------------------
  */

  const handleNewLinkChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setNewLink(
      (currentLink) => ({
        ...currentLink,
        [name]: value,
      })
    );

    clearTemporaryStatus();
  };

  /*
  |--------------------------------------------------------------------------
  | NEW LINK VISIBILITY
  |--------------------------------------------------------------------------
  */

  const toggleNewLinkVisibility =
    () => {
      setNewLink(
        (currentLink) => ({
          ...currentLink,
          visible:
            !currentLink.visible,
        })
      );
    };

  /*
  |--------------------------------------------------------------------------
  | VALIDATE PROFESSIONAL LINK
  |--------------------------------------------------------------------------
  */

  const validateProfessionalLink = (
    link
  ) => {
    const label =
      link.label.trim();

    const url =
      link.url.trim();

    if (!label) {
      return "Please enter a name for the link.";
    }

    if (!url) {
      return "Please enter the link URL.";
    }

    if (
      !isValidProfessionalLinkUrl(
        url,
        link.type
      )
    ) {
      return link.type === "email"
        ? "Please enter a valid email link such as mailto:name@example.com."
        : "Please enter a valid HTTP or HTTPS URL.";
    }

    return "";
  };

  /*
  |--------------------------------------------------------------------------
  | ADD LINK
  |--------------------------------------------------------------------------
  */

  const handleAddLink = () => {
    const validationMessage =
      validateProfessionalLink(
        newLink
      );

    if (validationMessage) {
      setStatus({
        type: "warning",
        message:
          `⚠️ ${validationMessage}`,
      });

      return;
    }

    setLinks(
      (currentLinks) => [
        ...currentLinks,
        {
          ...newLink,
          id:
            newLink.id ||
            generateLinkId(),
          label:
            newLink.label.trim(),
          url:
            newLink.url.trim(),
          type:
            newLink.type || "other",
          visible:
            newLink.visible !== false,
          displayOrder:
            currentLinks.length,
        },
      ]
    );

    setNewLink({
      ...EMPTY_LINK,
      id: generateLinkId(),
    });

    setIsAddingLink(false);

    setStatus({
      type: "success",
      message:
        "🔗 Professional link added. Save changes to apply it.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | START EDIT LINK
  |--------------------------------------------------------------------------
  */

  const handleStartEditLink = (
    link
  ) => {
    setEditingLinkId(
      link.id
    );

    setEditingLink({
      ...EMPTY_EDIT_LINK,
      ...link,
      id:
        link.id,
      serverId:
        link.serverId || "",
    });

    setIsAddingLink(false);
    clearTemporaryStatus();
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT LINK FIELD CHANGE
  |--------------------------------------------------------------------------
  */

  const handleEditLinkChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setEditingLink(
      (currentLink) => ({
        ...currentLink,
        [name]: value,
      })
    );

    clearTemporaryStatus();
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT LINK VISIBILITY
  |--------------------------------------------------------------------------
  */

  const toggleEditingLinkVisibility =
    () => {
      setEditingLink(
        (currentLink) => ({
          ...currentLink,
          visible:
            !currentLink.visible,
        })
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SAVE LINK EDIT
  |--------------------------------------------------------------------------
  */

  const handleSaveLinkEdit = () => {
    const validationMessage =
      validateProfessionalLink(
        editingLink
      );

    if (validationMessage) {
      setStatus({
        type: "warning",
        message:
          `⚠️ ${validationMessage}`,
      });

      return;
    }

    setLinks(
      (currentLinks) =>
        currentLinks.map(
          (link) =>
            link.id === editingLinkId
              ? {
                  ...link,
                  ...editingLink,
                  label:
                    editingLink.label.trim(),
                  url:
                    editingLink.url.trim(),
                }
              : link
        )
    );

    setEditingLinkId("");
    setEditingLink(
      EMPTY_EDIT_LINK
    );

    setStatus({
      type: "success",
      message:
        "✏️ Link updated in the form. Save changes to apply it.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL LINK EDIT
  |--------------------------------------------------------------------------
  */

  const handleCancelLinkEdit = () => {
    setEditingLinkId("");
    setEditingLink(
      EMPTY_EDIT_LINK
    );
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE LINK REQUEST
  |--------------------------------------------------------------------------
  */

  const requestDeleteLink = (
    link
  ) => {
    setConfirmAction({
      title:
        `Delete ${link.label || "this link"}?`,
      message:
        "This professional link will be removed when you save the profile changes.",
      confirmLabel:
        "Delete link",
      danger: true,
      onConfirm: () => {
        setLinks(
          (currentLinks) =>
            currentLinks.filter(
              (item) =>
                item.id !==
                link.id
            )
        );

        if (
          editingLinkId === link.id
        ) {
          setEditingLinkId("");
          setEditingLink(
            EMPTY_EDIT_LINK
          );
        }

        setStatus({
          type: "info",
          message:
            "🔗 Link removal is pending. Save changes to apply it.",
        });
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | LINK VISIBILITY
  |--------------------------------------------------------------------------
  */

  const handleToggleLinkVisibility =
    (linkId) => {
      setLinks(
        (currentLinks) =>
          currentLinks.map(
            (link) =>
              link.id === linkId
                ? {
                    ...link,
                    visible:
                      !link.visible,
                  }
                : link
          )
      );

      clearTemporaryStatus();
    };

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  |
  | Saves profile information, links and visibility,
  | then uploads/replaces/removes the profile photo.
  |
  */

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!isProfileLoaded) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Please wait until the profile has finished loading.",
      });
      return;
    }

    if (!profile.name.trim()) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Please enter the profile name before saving.",
      });
      return;
    }

    if (
      profile.email.trim() &&
      !isValidEmail(
        profile.email.trim()
      )
    ) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Please enter a valid email address.",
      });
      return;
    }

    if (
      profile.phone.trim() &&
      profile.phone.trim().length < 7
    ) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Please enter a valid phone number.",
      });
      return;
    }

    if (editingLinkId) {
      setStatus({
        type: "warning",
        message:
          "⚠️ Please finish or cancel the link edit before saving.",
      });
      return;
    }

    for (const link of links) {
      const validationMessage =
        validateProfessionalLink(
          link
        );

      if (validationMessage) {
        setStatus({
          type: "warning",
          message:
            `⚠️ ${validationMessage}`,
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      /*
       * ---------------------------------------------------------------
       * PROFILE INFORMATION
       * ---------------------------------------------------------------
       */

      setStatus({
        type: "loading",
        message:
          "⏳ Saving your profile information...",
      });

      const profilePayload = {
        name:
          profile.name.trim(),
        headline:
          profile.headline.trim(),
        shortBio:
          profile.shortBio.trim(),
        email:
          profile.email.trim(),
        phone:
          profile.phone.trim(),
        currentAddress:
          profile.currentAddress.trim(),
        permanentAddress:
          profile.permanentAddress.trim(),
      };

      const profileResponse =
        await fetch(
          `${API_BASE_URL}/api/admin/profile`,
          {
            method:
              profileExists
                ? "PUT"
                : "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body: JSON.stringify(
              profilePayload
            ),
          }
        );

      const profileData =
        await profileResponse
          .json()
          .catch(
            () => ({})
          );

      if (
        profileResponse.status ===
          401 ||
        profileResponse.status ===
          403
      ) {
        navigate(
          "/admin/login?auth=required",
          { replace: true }
        );
        return;
      }

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message ||
            "Failed to save profile information."
        );
      }

      setProfileExists(true);

      /*
       * ---------------------------------------------------------------
       * PROFESSIONAL LINKS
       * ---------------------------------------------------------------
       */

      setStatus({
        type: "loading",
        message:
          "⏳ Saving professional links...",
      });

      const normalizedLinks =
        links.map(
          (link, index) => ({
            ...(link.serverId
              ? {
                  _id:
                    link.serverId,
                }
              : {}),
            label:
              link.label.trim(),
            url:
              link.url.trim(),
            type:
              link.type ||
              "other",
            visible:
              link.visible !== false,
            displayOrder:
              index,
          })
        );

      const linksResponse =
        await fetch(
          `${API_BASE_URL}/api/admin/profile/links`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body: JSON.stringify({
              links:
                normalizedLinks,
            }),
          }
        );

      const linksData =
        await linksResponse
          .json()
          .catch(
            () => ({})
          );

      if (
        linksResponse.status ===
          401 ||
        linksResponse.status ===
          403
      ) {
        navigate(
          "/admin/login?auth=required",
          { replace: true }
        );
        return;
      }

      if (!linksResponse.ok) {
        throw new Error(
          linksData.message ||
            "Failed to save professional links."
        );
      }

      /*
       * ---------------------------------------------------------------
       * CONTACT VISIBILITY
       * ---------------------------------------------------------------
       */

      setStatus({
        type: "loading",
        message:
          "⏳ Saving contact visibility settings...",
      });

      const visibilityResponse =
        await fetch(
          `${API_BASE_URL}/api/admin/profile/visibility`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body: JSON.stringify(
              visibility
            ),
          }
        );

      const visibilityData =
        await visibilityResponse
          .json()
          .catch(
            () => ({})
          );

      if (
        visibilityResponse.status ===
          401 ||
        visibilityResponse.status ===
          403
      ) {
        navigate(
          "/admin/login?auth=required",
          { replace: true }
        );
        return;
      }

      if (!visibilityResponse.ok) {
        throw new Error(
          visibilityData.message ||
            "Failed to save visibility settings."
        );
      }

      /*
       * ---------------------------------------------------------------
       * PROFILE PHOTO
       * ---------------------------------------------------------------
       */

      if (profilePhoto) {
        setStatus({
          type: "loading",
          message:
            "⏳ Uploading profile photo to cloud storage...",
        });

        const formData =
          new FormData();

        formData.append(
          "profilePhoto",
          profilePhoto
        );

        const photoResponse =
          await fetch(
            `${API_BASE_URL}/api/admin/profile/photo`,
            {
              method:
                "PATCH",
              credentials:
                "include",
              body:
                formData,
            }
          );

        const photoData =
          await photoResponse
            .json()
            .catch(
              () => ({})
            );

        if (
          photoResponse.status ===
            401 ||
          photoResponse.status ===
            403
        ) {
          navigate(
            "/admin/login?auth=required",
            { replace: true }
          );
          return;
        }

        if (!photoResponse.ok) {
          throw new Error(
            photoData.message ||
              "Failed to upload profile photo."
          );
        }

        setProfilePhoto(
          null
        );

        setHasPersistedProfilePhoto(
          true
        );

        if (
          profilePhotoInputRef.current
        ) {
          profilePhotoInputRef.current.value =
            "";
        }
      } else if (
        !profilePhotoPreview &&
        hasPersistedProfilePhoto
      ) {
        setStatus({
          type: "loading",
          message:
            "⏳ Removing profile photo...",
        });

        const photoResponse =
          await fetch(
            `${API_BASE_URL}/api/admin/profile/photo`,
            {
              method:
                "DELETE",
              credentials:
                "include",
            }
          );

        const photoData =
          await photoResponse
            .json()
            .catch(
              () => ({})
            );

        if (
          photoResponse.status ===
            401 ||
          photoResponse.status ===
            403
        ) {
          navigate(
            "/admin/login?auth=required",
            { replace: true }
          );
          return;
        }

        if (
          !photoResponse.ok &&
          photoResponse.status !==
            404
        ) {
          throw new Error(
            photoData.message ||
              "Failed to remove profile photo."
          );
        }

        setHasPersistedProfilePhoto(
          false
        );
      }

      /*
       * ---------------------------------------------------------------
       * RESUME
       * ---------------------------------------------------------------
       */

      if (
        resume instanceof File
      ) {
        setStatus({
          type: "loading",
          message:
            "⏳ Uploading resume securely to cloud storage...",
        });

        const formData =
          new FormData();

        formData.append(
          "resume",
          resume
        );

        const resumeResponse =
          await fetch(
            `${API_BASE_URL}/api/admin/profile/resume`,
            {
              method:
                "PATCH",
              credentials:
                "include",
              body:
                formData,
            }
          );

        const resumeData =
          await resumeResponse
            .json()
            .catch(
              () => ({})
            );

        if (
          resumeResponse.status ===
            401 ||
          resumeResponse.status ===
            403
        ) {
          navigate(
            "/admin/login?auth=required",
            { replace: true }
          );
          return;
        }

        if (!resumeResponse.ok) {
          throw new Error(
            resumeData.message ||
              "Failed to upload resume."
          );
        }

        setHasPersistedResume(
          true
        );

        setResumeRemovalRequested(
          false
        );

        const persistedResume =
          resumeData.profile?.resume ||
          resumeData.resume;

        setResume({
          name:
            persistedResume?.originalName ||
            resume.name,
          size:
            persistedResume?.size ||
            resume.size ||
            0,
          existing: true,
        });

        if (
          resumeInputRef.current
        ) {
          resumeInputRef.current.value =
            "";
        }

        /*
         * Save the selected public
         * visibility for the uploaded resume.
         */

        const resumeVisibilityResponse =
          await fetch(
            `${API_BASE_URL}/api/admin/profile/resume/visibility`,
            {
              method:
                "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials:
                "include",
              body: JSON.stringify({
                visible:
                  resumeVisibility,
              }),
            }
          );

        const resumeVisibilityData =
          await resumeVisibilityResponse
            .json()
            .catch(
              () => ({})
            );

        if (
          resumeVisibilityResponse.status ===
            401 ||
          resumeVisibilityResponse.status ===
            403
        ) {
          navigate(
            "/admin/login?auth=required",
            { replace: true }
          );
          return;
        }

        if (
          !resumeVisibilityResponse.ok
        ) {
          throw new Error(
            resumeVisibilityData.message ||
              "Resume uploaded, but visibility could not be saved."
          );
        }
      } else if (
        resumeRemovalRequested &&
        hasPersistedResume
      ) {
        setStatus({
          type: "loading",
          message:
            "⏳ Removing the current resume...",
        });

        const resumeResponse =
          await fetch(
            `${API_BASE_URL}/api/admin/profile/resume`,
            {
              method:
                "DELETE",
              credentials:
                "include",
            }
          );

        const resumeData =
          await resumeResponse
            .json()
            .catch(
              () => ({})
            );

        if (
          resumeResponse.status ===
            401 ||
          resumeResponse.status ===
            403
        ) {
          navigate(
            "/admin/login?auth=required",
            { replace: true }
          );
          return;
        }

        if (
          !resumeResponse.ok &&
          resumeResponse.status !==
            404
        ) {
          throw new Error(
            resumeData.message ||
              "Failed to remove resume."
          );
        }

        setHasPersistedResume(
          false
        );

        setResumeRemovalRequested(
          false
        );

        setResume(null);
        setResumeVisibility(
          true
        );
      } else if (
        hasPersistedResume
      ) {
        setStatus({
          type: "loading",
          message:
            "⏳ Saving resume visibility...",
        });

        const resumeVisibilityResponse =
          await fetch(
            `${API_BASE_URL}/api/admin/profile/resume/visibility`,
            {
              method:
                "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials:
                "include",
              body: JSON.stringify({
                visible:
                  resumeVisibility,
              }),
            }
          );

        const resumeVisibilityData =
          await resumeVisibilityResponse
            .json()
            .catch(
              () => ({})
            );

        if (
          resumeVisibilityResponse.status ===
            401 ||
          resumeVisibilityResponse.status ===
            403
        ) {
          navigate(
            "/admin/login?auth=required",
            { replace: true }
          );
          return;
        }

        if (
          !resumeVisibilityResponse.ok
        ) {
          throw new Error(
            resumeVisibilityData.message ||
              "Failed to save resume visibility."
          );
        }
      }

      setStatus({
        type: "success",
        message:
          "🎉 Profile, links, contact visibility, photo and resume changes saved successfully.",
      });
    } catch (error) {
      console.error(
        "Save admin profile error:",
        error
      );

      setStatus({
        type: "error",
        message:
          error.message ||
          "❌ Failed to save profile changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR STATUS
  |--------------------------------------------------------------------------
  */

  const clearTemporaryStatus =
    () => {
      if (
        status.message &&
        status.type !== "loading"
      ) {
        setStatus({
          type: "",
          message: "",
        });
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CLOSE TOAST
  |--------------------------------------------------------------------------
  */

  const handleCloseToast = () => {
    setStatus({
      type: "",
      message: "",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | URL VALIDATION
  |--------------------------------------------------------------------------
  */

  const isValidHttpUrl = (
    value
  ) => {
    try {
      const url =
        new URL(value);

      return (
        url.protocol === "http:" ||
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PROFESSIONAL LINK URL VALIDATION
  |--------------------------------------------------------------------------
  */

  const isValidProfessionalLinkUrl = (
    value,
    type
  ) => {
    const normalizedValue =
      value.trim();

    if (type === "email") {
      if (
        normalizedValue
          .toLowerCase()
          .startsWith("mailto:")
      ) {
        const email =
          normalizedValue
            .slice(7)
            .split("?")[0]
            .trim();

        return isValidEmail(
          email
        );
      }

      return (
        isValidHttpUrl(
          normalizedValue
        ) ||
        isValidEmail(
          normalizedValue
        )
      );
    }

    return isValidHttpUrl(
      normalizedValue
    );
  };

  /*
  |--------------------------------------------------------------------------
  | EMAIL VALIDATION
  |--------------------------------------------------------------------------
  */

  const isValidEmail = (
    value
  ) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value
    );
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT FILE SIZE
  |--------------------------------------------------------------------------
  */

  const formatFileSize = (
    bytes
  ) => {
    if (!bytes) {
      return "0 KB";
    }

    if (bytes < 1024 * 1024) {
      return `${Math.ceil(
        bytes / 1024
      )} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  /*
  |--------------------------------------------------------------------------
  | LINK ICON
  |--------------------------------------------------------------------------
  */

  const getLinkIcon = (
    type
  ) => {
    if (type === "github") {
      return FaGithub;
    }

    if (type === "linkedin") {
      return FaLinkedin;
    }

    if (type === "email") {
      return Mail;
    }

    if (type === "website") {
      return Globe2;
    }

    return Globe2;
  };

  /*
  |--------------------------------------------------------------------------
  | BACK TO DASHBOARD
  |--------------------------------------------------------------------------
  */

  const handleBackToDashboard = () => {
    if (isSaving) {
      return;
    }

    navigate("/admin/dashboard");
  };

  /*
  |--------------------------------------------------------------------------
  | CONFIRMATION MODAL KEYBOARD CONTROL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!confirmAction) {
      return undefined;
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setConfirmAction(
          null
        );
        return;
      }

      if (
        event.key ===
        "Enter"
      ) {
        event.preventDefault();
        confirmButtonRef.current?.click();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [confirmAction]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="admin-profile-page">

      {/* ================================================================
          BACKGROUND
          ================================================================ */}

      <div
        className="admin-profile-background"
        aria-hidden="true"
      >
        <div className="admin-profile-background-glow admin-profile-background-glow-one" />

        <div className="admin-profile-background-glow admin-profile-background-glow-two" />

        <div className="admin-profile-background-grid" />
      </div>

      {/* ================================================================
          TOP HEADER
          ================================================================ */}

      <header className="admin-profile-header">

        <div className="admin-profile-header-left">

          <button
            type="button"
            className="admin-profile-back-button"
            onClick={
              handleBackToDashboard
            }
            disabled={isSaving}
            aria-label="Back to dashboard"
          >
            <ArrowLeft
              size={19}
              strokeWidth={1.9}
            />
          </button>

          <div className="admin-profile-header-icon">
            <UserRound
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <div className="admin-profile-header-copy">
            <span>
              CMS MODULE
            </span>

            <h1>
              Profile
            </h1>

            <p>
              Manage your professional
              identity and public profile
              information.
            </p>
          </div>

        </div>

        <div className="admin-profile-header-actions">

          <div className="admin-profile-save-state">
            <span className="admin-profile-save-dot" />

            <span>
              CMS changes are ready to save
            </span>
          </div>

          <button
            type="button"
            className="admin-profile-save-button admin-profile-save-button-header"
            onClick={() =>
              document
                .getElementById(
                  "admin-profile-form"
                )
                ?.requestSubmit()
            }
            disabled={isSaving || !isProfileLoaded}
          >
            <Save
              size={17}
              strokeWidth={1.9}
            />

            <span>
              {isSaving
                ? "Saving..."
                : "Save changes"}
            </span>
          </button>

        </div>
      </header>

      {/* ================================================================
          MAIN
          ================================================================ */}

      <main className="admin-profile-main">

        <form
          id="admin-profile-form"
          className="admin-profile-form"
          onSubmit={handleSave}
        >

          {/* ============================================================
              IDENTITY
              ============================================================ */}

          <section className="admin-profile-card admin-profile-identity-card">

            <div className="admin-profile-card-heading">

              <div>
                <span className="admin-profile-card-kicker">
                  IDENTITY
                </span>

                <h2>
                  Professional identity
                </h2>

                <p>
                  This information will form
                  the foundation of your public
                  portfolio profile.
                </p>
              </div>

              <div className="admin-profile-card-heading-icon">
                <UserRound
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

            </div>

            <div className="admin-profile-identity-layout">

              {/* ======================================================
                  PHOTO
                  ====================================================== */}

              <div className="admin-profile-photo-section">

                <div className="admin-profile-photo-preview">

                  {profilePhotoPreview ? (
                    <img
                      src={
                        profilePhotoPreview
                      }
                      alt="Selected profile preview"
                    />
                  ) : (
                    <UserRound
                      size={46}
                      strokeWidth={1.35}
                    />
                  )}

                </div>

                <div className="admin-profile-photo-copy">

                  <strong>
                    Profile photo
                  </strong>

                  <p>
                    JPG, PNG or WEBP ·
                    Maximum{" "}
                    {PROFILE_PHOTO_MAX_SIZE_LABEL}
                  </p>

                  <div className="admin-profile-photo-actions">

                    <button
                      type="button"
                      className="admin-profile-secondary-button"
                      onClick={() =>
                        profilePhotoInputRef.current?.click()
                      }
                      disabled={isSaving}
                    >
                      <Upload
                        size={15}
                        strokeWidth={1.9}
                      />

                      <span>
                        {profilePhotoPreview
                          ? "Replace"
                          : "Upload photo"}
                      </span>
                    </button>

                    {profilePhotoPreview && (
                      <button
                        type="button"
                        className="admin-profile-icon-button admin-profile-danger-button"
                        onClick={
                          handleRemoveProfilePhoto
                        }
                        disabled={isSaving}
                        aria-label="Remove profile photo"
                        title="Remove profile photo"
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.8}
                        />
                      </button>
                    )}

                  </div>

                  <input
                    ref={
                      profilePhotoInputRef
                    }
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="admin-profile-hidden-input"
                    onChange={
                      handleProfilePhotoChange
                    }
                  />

                </div>

              </div>

              {/* ======================================================
                  IDENTITY FIELDS
                  ====================================================== */}

              <div className="admin-profile-field-grid">

                <div className="admin-profile-field admin-profile-field-full">

                  <label htmlFor="profile-name">
                    Display name
                    <span>*</span>
                  </label>

                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    value={profile.name}
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Enter the name you want displayed publicly"
                    autoComplete="name"
                    maxLength={100}
                  />

                </div>

                <div className="admin-profile-field admin-profile-field-full">

                  <label htmlFor="profile-headline">
                    Professional headline
                  </label>

                  <input
                    id="profile-headline"
                    name="headline"
                    type="text"
                    value={
                      profile.headline
                    }
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Your flexible professional identity"
                    maxLength={160}
                  />

                  <span className="admin-profile-field-hint">
                    Keep this flexible so your
                    profile can evolve across
                    technologies and roles.
                  </span>

                </div>

                <div className="admin-profile-field admin-profile-field-full">

                  <label htmlFor="profile-short-bio">
                    Short professional bio
                  </label>

                  <textarea
                    id="profile-short-bio"
                    name="shortBio"
                    value={
                      profile.shortBio
                    }
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Write a concise introduction for your professional profile."
                    rows={5}
                    maxLength={600}
                  />

                  <div className="admin-profile-character-count">
                    {
                      profile.shortBio
                        .length
                    }
                    /600
                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* ============================================================
              CONTACT INFORMATION
              ============================================================ */}

          <section className="admin-profile-card">

            <div className="admin-profile-card-heading">

              <div>
                <span className="admin-profile-card-kicker">
                  CONTACT
                </span>

                <h2>
                  Professional contact
                </h2>

                <p>
                  Control the contact information
                  associated with your public
                  portfolio.
                </p>
              </div>

              <div className="admin-profile-card-heading-icon">
                <Mail
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

            </div>

            <div className="admin-profile-field-grid">

              <div className="admin-profile-field">

                <label htmlFor="profile-email">
                  Email address
                </label>

                <div className="admin-profile-input-with-icon">

                  <Mail
                    size={16}
                    strokeWidth={1.8}
                  />

                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    value={
                      profile.email
                    }
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Professional email address"
                    autoComplete="email"
                  />

                </div>

                <VisibilityToggle
                  label="Show email publicly"
                  checked={
                    visibility.email
                  }
                  onChange={() =>
                    handleVisibilityChange(
                      "email"
                    )
                  }
                />

              </div>

              <div className="admin-profile-field">

                <label htmlFor="profile-phone">
                  Phone number
                </label>

                <div className="admin-profile-input-with-icon">

                  <Phone
                    size={16}
                    strokeWidth={1.8}
                  />

                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    value={
                      profile.phone
                    }
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Professional phone number"
                    autoComplete="tel"
                  />

                </div>

                <VisibilityToggle
                  label="Show phone publicly"
                  checked={
                    visibility.phone
                  }
                  onChange={() =>
                    handleVisibilityChange(
                      "phone"
                    )
                  }
                />

              </div>

              <div className="admin-profile-field">

                <label htmlFor="profile-current-address">
                  Current address
                </label>

                <div className="admin-profile-input-with-icon">

                  <MapPin
                    size={16}
                    strokeWidth={1.8}
                  />

                  <input
                    id="profile-current-address"
                    name="currentAddress"
                    type="text"
                    value={
                      profile.currentAddress
                    }
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Current professional location"
                  />

                </div>

                <VisibilityToggle
                  label="Show current address publicly"
                  checked={
                    visibility.currentAddress
                  }
                  onChange={() =>
                    handleVisibilityChange(
                      "currentAddress"
                    )
                  }
                />

              </div>

              <div className="admin-profile-field">

                <label htmlFor="profile-permanent-address">
                  Permanent address
                </label>

                <div className="admin-profile-input-with-icon">

                  <MapPin
                    size={16}
                    strokeWidth={1.8}
                  />

                  <input
                    id="profile-permanent-address"
                    name="permanentAddress"
                    type="text"
                    value={
                      profile.permanentAddress
                    }
                    onChange={
                      handleProfileChange
                    }
                    placeholder="Permanent address"
                  />

                </div>

                <VisibilityToggle
                  label="Show permanent address publicly"
                  checked={
                    visibility.permanentAddress
                  }
                  onChange={() =>
                    handleVisibilityChange(
                      "permanentAddress"
                    )
                  }
                />

              </div>

            </div>

          </section>

          {/* ============================================================
              SOCIAL / PROFESSIONAL LINKS
              ============================================================ */}

          <section className="admin-profile-card">

            <div className="admin-profile-card-heading">

              <div>
                <span className="admin-profile-card-kicker">
                  PROFESSIONAL LINKS
                </span>

                <h2>
                  GitHub, LinkedIn & more
                </h2>

                <p>
                  Add, edit, hide or remove
                  your professional platforms.
                </p>
              </div>

              <div className="admin-profile-card-heading-icon">
                <Globe2
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

            </div>

            {links.length > 0 ? (
              <div className="admin-profile-links-list">

                {links.map((link) => {
                  const LinkIcon =
                    getLinkIcon(
                      link.type
                    );

                  if (
                    editingLinkId ===
                    link.id
                  ) {
                    return (
                      <div
                        className="admin-profile-add-link-panel"
                        key={link.id}
                      >

                        <div className="admin-profile-add-link-header">

                          <div>
                            <strong>
                              Edit professional link
                            </strong>

                            <p>
                              Update the platform
                              details and save
                              the profile when
                              ready.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="admin-profile-icon-button"
                            onClick={
                              handleCancelLinkEdit
                            }
                            disabled={isSaving}
                            aria-label="Cancel link edit"
                          >
                            <X
                              size={17}
                              strokeWidth={1.9}
                            />
                          </button>

                        </div>

                        <div className="admin-profile-field-grid">

                          <div className="admin-profile-field">

                            <label
                              htmlFor={`edit-link-label-${link.id}`}
                            >
                              Link name
                            </label>

                            <input
                              id={`edit-link-label-${link.id}`}
                              name="label"
                              type="text"
                              value={
                                editingLink.label
                              }
                              onChange={
                                handleEditLinkChange
                              }
                              placeholder="e.g. GitHub"
                              maxLength={60}
                              autoFocus
                            />

                          </div>

                          <div className="admin-profile-field">

                            <label
                              htmlFor={`edit-link-type-${link.id}`}
                            >
                              Platform
                            </label>

                            <select
                              id={`edit-link-type-${link.id}`}
                              name="type"
                              value={
                                editingLink.type
                              }
                              onChange={
                                handleEditLinkChange
                              }
                            >
                              {SOCIAL_LINK_TYPES.map(
                                (type) => (
                                  <option
                                    key={
                                      type.value
                                    }
                                    value={
                                      type.value
                                    }
                                  >
                                    {type.label}
                                  </option>
                                )
                              )}
                            </select>

                          </div>

                          <div className="admin-profile-field admin-profile-field-full">

                            <label
                              htmlFor={`edit-link-url-${link.id}`}
                            >
                              URL
                            </label>

                            <div className="admin-profile-input-with-icon">

                              <Globe2
                                size={16}
                                strokeWidth={1.8}
                              />

                              <input
                                id={`edit-link-url-${link.id}`}
                                name="url"
                                type="text"
                                value={
                                  editingLink.url
                                }
                                onChange={
                                  handleEditLinkChange
                                }
                                placeholder={
                                  editingLink.type ===
                                  "email"
                                    ? "mailto:name@example.com"
                                    : "https://..."
                                }
                                autoComplete="url"
                              />

                            </div>

                          </div>

                        </div>

                        <div className="admin-profile-add-link-footer">

                          <VisibilityToggle
                            label="Show this link publicly"
                            checked={
                              editingLink.visible
                            }
                            onChange={
                              toggleEditingLinkVisibility
                            }
                          />

                          <div className="admin-profile-inline-actions">

                            <button
                              type="button"
                              className="admin-profile-secondary-button"
                              onClick={
                                handleCancelLinkEdit
                              }
                              disabled={isSaving}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="admin-profile-primary-small-button"
                              onClick={
                                handleSaveLinkEdit
                              }
                              disabled={isSaving}
                            >
                              <Save
                                size={15}
                                strokeWidth={2}
                              />

                              <span>
                                Update link
                              </span>
                            </button>

                          </div>

                        </div>

                      </div>
                    );
                  }

                  return (
                    <div
                      className="admin-profile-link-row"
                      key={link.id}
                    >

                      <div className="admin-profile-link-icon">
                        <LinkIcon
                          size={18}
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="admin-profile-link-details">

                        <strong>
                          {link.label}
                        </strong>

                        <span>
                          {link.url}
                        </span>

                      </div>

                      <button
                        type="button"
                        className={`admin-profile-link-visibility ${
                          link.visible
                            ? "is-visible"
                            : "is-hidden"
                        }`}
                        onClick={() =>
                          handleToggleLinkVisibility(
                            link.id
                          )
                        }
                        disabled={isSaving}
                        title={
                          link.visible
                            ? "Visible publicly"
                            : "Hidden publicly"
                        }
                      >
                        {link.visible ? (
                          <>
                            <Eye
                              size={14}
                              strokeWidth={1.8}
                            />

                            <span>
                              Public
                            </span>
                          </>
                        ) : (
                          <>
                            <EyeOff
                              size={14}
                              strokeWidth={1.8}
                            />

                            <span>
                              Hidden
                            </span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="admin-profile-icon-button"
                        onClick={() =>
                          handleStartEditLink(
                            link
                          )
                        }
                        disabled={isSaving}
                        aria-label={`Edit ${link.label}`}
                        title={`Edit ${link.label}`}
                      >
                        <Pencil
                          size={16}
                          strokeWidth={1.8}
                        />
                      </button>

                      <button
                        type="button"
                        className="admin-profile-icon-button admin-profile-danger-button"
                        onClick={() =>
                          requestDeleteLink(
                            link
                          )
                        }
                        disabled={isSaving}
                        aria-label={`Delete ${link.label}`}
                        title={`Delete ${link.label}`}
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.8}
                        />
                      </button>

                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="admin-profile-empty-state">
                <Globe2
                  size={21}
                  strokeWidth={1.7}
                />

                <div>
                  <strong>
                    No professional links yet
                  </strong>

                  <p>
                    Add GitHub, LinkedIn,
                    email, website or another
                    professional platform.
                  </p>
                </div>
              </div>
            )}

            {isAddingLink ? (
              <div className="admin-profile-add-link-panel">

                <div className="admin-profile-add-link-header">

                  <div>
                    <strong>
                      Add professional link
                    </strong>

                    <p>
                      Add GitHub, LinkedIn,
                      email, website or another
                      professional platform.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-profile-icon-button"
                    onClick={() => {
                      setIsAddingLink(
                        false
                      );
                      setNewLink({
                        ...EMPTY_LINK,
                        id:
                          generateLinkId(),
                      });
                    }}
                    disabled={isSaving}
                    aria-label="Close add link form"
                  >
                    <X
                      size={17}
                      strokeWidth={1.9}
                    />
                  </button>

                </div>

                <div className="admin-profile-field-grid">

                  <div className="admin-profile-field">

                    <label htmlFor="new-link-label">
                      Link name
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
                      placeholder="e.g. GitHub"
                      maxLength={60}
                      autoFocus
                    />

                  </div>

                  <div className="admin-profile-field">

                    <label htmlFor="new-link-type">
                      Platform
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
                      {SOCIAL_LINK_TYPES.map(
                        (type) => (
                          <option
                            key={
                              type.value
                            }
                            value={
                              type.value
                            }
                          >
                            {type.label}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                  <div className="admin-profile-field admin-profile-field-full">

                    <label htmlFor="new-link-url">
                      URL
                    </label>

                    <div className="admin-profile-input-with-icon">

                      <Globe2
                        size={16}
                        strokeWidth={1.8}
                      />

                      <input
                        id="new-link-url"
                        name="url"
                        type="text"
                        value={
                          newLink.url
                        }
                        onChange={
                          handleNewLinkChange
                        }
                        placeholder={
                          newLink.type ===
                          "email"
                            ? "mailto:name@example.com"
                            : "https://..."
                        }
                        autoComplete="url"
                      />

                    </div>

                  </div>

                </div>

                <div className="admin-profile-add-link-footer">

                  <VisibilityToggle
                    label="Show this link publicly"
                    checked={
                      newLink.visible
                    }
                    onChange={
                      toggleNewLinkVisibility
                    }
                  />

                  <div className="admin-profile-inline-actions">

                    <button
                      type="button"
                      className="admin-profile-secondary-button"
                      onClick={() => {
                        setIsAddingLink(
                          false
                        );
                        setNewLink({
                          ...EMPTY_LINK,
                          id:
                            generateLinkId(),
                        });
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="admin-profile-primary-small-button"
                      onClick={
                        handleAddLink
                      }
                      disabled={isSaving}
                    >
                      <Plus
                        size={15}
                        strokeWidth={2}
                      />

                      <span>
                        Add link
                      </span>
                    </button>

                  </div>

                </div>

              </div>
            ) : (
              <button
                type="button"
                className="admin-profile-add-link-button"
                onClick={() => {
                  setIsAddingLink(
                    true
                  );
                  setEditingLinkId(
                    ""
                  );
                  setEditingLink(
                    EMPTY_EDIT_LINK
                  );
                }}
                disabled={isSaving}
              >
                <span className="admin-profile-add-link-button-icon">
                  <Plus
                    size={18}
                    strokeWidth={2}
                  />
                </span>

                <span>
                  Add professional link
                </span>
              </button>
            )}

            <div className="admin-profile-link-note">

              <ShieldCheck
                size={16}
                strokeWidth={1.8}
              />

              <p>
                Changes remain in the form
                until you save. Hidden links
                stay in the CMS but are excluded
                from the public portfolio.
              </p>

            </div>

          </section>

          {/* ============================================================
              RESUME
              ============================================================ */}

          <section className="admin-profile-card">

            <div className="admin-profile-card-heading">

              <div>
                <span className="admin-profile-card-kicker">
                  RESUME
                </span>

                <h2>
                  Current resume
                </h2>

                <p>
                  Upload a PDF, preview the
                  active version, replace it
                  and control public visibility.
                </p>
              </div>

              <div className="admin-profile-card-heading-icon">
                <FileText
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

            </div>

            {resume ? (
              <div className="admin-profile-resume-card">

                <div className="admin-profile-resume-icon">
                  <FileText
                    size={23}
                    strokeWidth={1.7}
                  />
                </div>

                <div className="admin-profile-resume-details">

                  <strong>
                    {resume.name}
                  </strong>

                  <span>
                    PDF ·{" "}
                    {formatFileSize(
                      resume.size
                    )}
                    {resume instanceof File
                      ? " · Pending upload"
                      : " · Stored securely"}
                  </span>

                </div>

                <button
                  type="button"
                  className="admin-profile-secondary-button"
                  onClick={
                    handleOpenResume
                  }
                  disabled={isSaving}
                >
                  <ExternalLink
                    size={15}
                    strokeWidth={1.9}
                  />

                  <span>
                    Preview
                  </span>
                </button>

                <button
                  type="button"
                  className="admin-profile-secondary-button"
                  onClick={() =>
                    resumeInputRef.current?.click()
                  }
                  disabled={isSaving}
                >
                  <Upload
                    size={15}
                    strokeWidth={1.9}
                  />

                  <span>
                    Replace
                  </span>
                </button>

                <button
                  type="button"
                  className="admin-profile-icon-button admin-profile-danger-button"
                  onClick={
                    requestRemoveResume
                  }
                  disabled={isSaving}
                  aria-label="Remove resume"
                  title="Remove resume"
                >
                  <Trash2
                    size={16}
                    strokeWidth={1.8}
                  />
                </button>

              </div>
            ) : (
              <button
                type="button"
                className="admin-profile-resume-upload"
                onClick={() =>
                  resumeInputRef.current?.click()
                }
                disabled={isSaving}
              >
                <div className="admin-profile-resume-upload-icon">
                  <Upload
                    size={22}
                    strokeWidth={1.7}
                  />
                </div>

                <div>

                  <strong>
                    Upload your current resume
                  </strong>

                  <span>
                    PDF only · Maximum 10 MB
                  </span>

                </div>

              </button>
            )}

            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="admin-profile-hidden-input"
              onChange={
                handleResumeChange
              }
              disabled={isSaving}
            />

            {resume && (
              <div className="admin-profile-resume-visibility">

                <VisibilityToggle
                  label="Show resume publicly"
                  checked={
                    resumeVisibility
                  }
                  onChange={
                    handleResumeVisibilityChange
                  }
                />

                <span className="admin-profile-field-hint">
                  {resumeVisibility
                    ? "Visitors can access the current resume from the public portfolio."
                    : "The resume stays available in the CMS but is hidden from public visitors."}
                </span>

              </div>
            )}

            <div className="admin-profile-resume-note">

              <ShieldCheck
                size={16}
                strokeWidth={1.8}
              />

              <p>
                PDF files are stored in
                persistent cloud storage.
                Public delivery uses a protected
                backend endpoint instead of
                exposing the permanent storage
                URL directly.
              </p>

            </div>

          </section>

          {/* ============================================================
              PUBLIC VISIBILITY
              ============================================================ */}

          <section className="admin-profile-card admin-profile-visibility-card">

            <div className="admin-profile-card-heading">

              <div>
                <span className="admin-profile-card-kicker">
                  PUBLIC VISIBILITY
                </span>

                <h2>
                  Control what visitors see
                </h2>

                <p>
                  Keep sensitive professional
                  information private when it
                  should not appear publicly.
                </p>
              </div>

              <div className="admin-profile-card-heading-icon">
                <Eye
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

            </div>

            <div className="admin-profile-visibility-list">

              <VisibilityRow
                icon={Mail}
                title="Email address"
                description="Allow visitors to see and use your professional email."
                checked={
                  visibility.email
                }
                onChange={() =>
                  handleVisibilityChange(
                    "email"
                  )
                }
              />

              <VisibilityRow
                icon={Phone}
                title="Phone number"
                description="Show your phone number and enable supported dial actions."
                checked={
                  visibility.phone
                }
                onChange={() =>
                  handleVisibilityChange(
                    "phone"
                  )
                }
              />

              <VisibilityRow
                icon={MapPin}
                title="Current address"
                description="Control whether your current location is visible publicly."
                checked={
                  visibility.currentAddress
                }
                onChange={() =>
                  handleVisibilityChange(
                    "currentAddress"
                  )
                }
              />

              <VisibilityRow
                icon={MapPin}
                title="Permanent address"
                description="Keep your permanent address private unless you explicitly choose to publish it."
                checked={
                  visibility.permanentAddress
                }
                onChange={() =>
                  handleVisibilityChange(
                    "permanentAddress"
                  )
                }
              />

            </div>

          </section>

          {/* ============================================================
              BOTTOM ACTIONS
              ============================================================ */}

          <div className="admin-profile-form-actions">

            <button
              type="button"
              className="admin-profile-secondary-button admin-profile-cancel-button"
              onClick={
                handleBackToDashboard
              }
              disabled={isSaving}
            >
              <ArrowLeft
                size={16}
                strokeWidth={1.9}
              />

              <span>
                Back to dashboard
              </span>
            </button>

            <button
              type="submit"
              className="admin-profile-save-button"
              disabled={isSaving || !isProfileLoaded}
            >
              {isSaving ? (
                <>
                  <span className="admin-profile-button-spinner" />

                  <span>
                    Saving...
                  </span>
                </>
              ) : (
                <>
                  <Save
                    size={17}
                    strokeWidth={1.9}
                  />

                  <span>
                    Save profile changes
                  </span>
                </>
              )}
            </button>

          </div>

        </form>
      </main>

      {/* ================================================================
          CONFIRMATION MODAL
          ================================================================ */}

      {confirmAction && (
        <div
          className="admin-profile-confirmation-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setConfirmAction(
                null
              );
            }
          }}
        >
          <div
            className="admin-profile-confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-profile-confirmation-title"
            aria-describedby="admin-profile-confirmation-message"
          >
            <div className="admin-profile-confirmation-icon">
              <Trash2
                size={21}
                strokeWidth={1.8}
              />
            </div>

            <div className="admin-profile-confirmation-content">

              <h2 id="admin-profile-confirmation-title">
                {confirmAction.title}
              </h2>

              <p id="admin-profile-confirmation-message">
                {confirmAction.message}
              </p>

            </div>

            <div className="admin-profile-confirmation-actions">

              <button
                type="button"
                className="admin-profile-secondary-button"
                onClick={() =>
                  setConfirmAction(
                    null
                  )
                }
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                ref={
                  confirmButtonRef
                }
                type="button"
                className={`admin-profile-primary-small-button ${
                  confirmAction.danger
                    ? "admin-profile-confirm-danger"
                    : ""
                }`}
                onClick={() => {
                  const action =
                    confirmAction.onConfirm;

                  setConfirmAction(
                    null
                  );

                  action?.();
                }}
                disabled={isSaving}
              >
                <Trash2
                  size={15}
                  strokeWidth={1.9}
                />

                <span>
                  {confirmAction.confirmLabel ||
                    "Confirm"}
                </span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ================================================================
          TOAST
          ================================================================ */}

      {status.message && (
        <div
          className={`admin-profile-toast admin-profile-toast-${status.type}`}
          role={
            status.type ===
            "error"
              ? "alert"
              : "status"
          }
        >

          <div className="admin-profile-toast-icon">

            {status.type ===
              "success" && (
              <Check
                size={17}
                strokeWidth={2.2}
              />
            )}

            {status.type ===
              "warning" && (
              <AtSign
                size={17}
                strokeWidth={2}
              />
            )}

            {status.type ===
              "error" && (
              <X
                size={17}
                strokeWidth={2.2}
              />
            )}

            {status.type ===
              "info" && (
              <ShieldCheck
                size={17}
                strokeWidth={1.9}
              />
            )}

            {status.type ===
              "loading" && (
              <span className="admin-profile-toast-spinner" />
            )}

          </div>

          <div className="admin-profile-toast-content">
            <strong>
              {status.type ===
              "success"
                ? "Success"
                : status.type ===
                  "warning"
                ? "Check this"
                : status.type ===
                  "error"
                ? "Something went wrong"
                : status.type ===
                  "loading"
                ? "Working"
                : "Information"}
            </strong>

            <p>
              {status.message}
            </p>
          </div>

          {status.type !==
            "loading" && (
            <button
              type="button"
              className="admin-profile-toast-close"
              onClick={
                handleCloseToast
              }
              aria-label="Close notification"
            >
              <X
                size={15}
                strokeWidth={2}
              />
            </button>
          )}

        </div>
      )}

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| VISIBILITY TOGGLE
|--------------------------------------------------------------------------
*/

function VisibilityToggle({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="admin-profile-toggle">

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />

      <span className="admin-profile-toggle-track">
        <span className="admin-profile-toggle-thumb" />
      </span>

      <span className="admin-profile-toggle-label">
        {label}
      </span>

    </label>
  );
}

/*
|--------------------------------------------------------------------------
| VISIBILITY ROW
|--------------------------------------------------------------------------
*/

function VisibilityRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="admin-profile-visibility-row">

      <div className="admin-profile-visibility-icon">
        <Icon
          size={17}
          strokeWidth={1.8}
        />
      </div>

      <div className="admin-profile-visibility-copy">

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

      </div>

      <label className="admin-profile-switch">

        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />

        <span className="admin-profile-switch-track">
          <span className="admin-profile-switch-thumb" />
        </span>

      </label>


    </div>
  );
}


export default AdminProfile;
