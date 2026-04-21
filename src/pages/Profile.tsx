import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../store/StoreProvider";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppToast } from "../utils/toast";
import { apiClient } from "../api/client";
import "./Profile.css";

type ProfileFormData = {
  name: string;
  age: string;
  maritalStatus: string;
  currency: string;
};

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Profile() {
  const { t } = useTranslation();
  const useStore = useAppStore();
  const { showSuccess, showError } = useAppToast();

  const currentUser   = useStore((s: any) => s.currentUser);
  const updateProfile = useStore((s: any) => s.updateProfile);

  const user = currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm<PasswordFormData>();

  const onChangePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      showError(t("auth.passwordMismatch", "Գաղտնաբառերը չեն համընկնում"));
      return;
    }
    try {
      await apiClient.changePassword(data.currentPassword, data.newPassword);
      resetPwd();
      showSuccess(t("profile.passwordChanged", "Գաղտնաբառը փոխվեց"));
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("incorrect")) {
        showError(t("profile.wrongCurrentPassword", "Ընթացիկ գաղտնաբառը սխալ է"));
      } else {
        showError(t("profile.passwordChangeError", "Չհաջողվեց փոխել գաղտնաբառը"));
      }
    }
  };

  const defaultValues = useMemo(
    () => ({
      name:          user?.name ?? "",
      age:           user?.profile?.age != null ? String(user.profile.age) : "",
      maritalStatus: user?.profile?.maritalStatus ?? "",
      currency:      user?.profile?.currency ?? "AMD",
    }),
    [user]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({ defaultValues });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (user?.profile?.avatar) {
      setAvatarPreview(user.profile.avatar);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showError(t("profile.avatarTooLarge", "Նկարը պետք է լինի 2MB-ից փոքր"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarPreview(base64);
      setAvatarBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="profile-empty">
        <div className="profile-empty-icon">👤</div>
        <h3>{t("profile.noUserTitle", "Մուտք չի կատարվել")}</h3>
        <p>{t("profile.noUserDescription", "Խնդրում ենք մուտք գործել")}</p>
      </div>
    );
  }

  const onSubmit = async (data: ProfileFormData) => {
    const name = data.name.trim();
    if (!name) {
      showError(t("profile.nameRequired", "Անվանումը պարտադիր է"));
      return;
    }

    const age = data.age.trim() ? Number(data.age.trim()) : undefined;
    if (data.age.trim() && (Number.isNaN(age) || Number(age) < 0)) {
      showError(t("profile.ageInvalid", "Տարիքը սխալ է"));
      return;
    }

    try {
      await updateProfile({
        name,
        profile: {
          age:           age ?? undefined,
          maritalStatus: data.maritalStatus || undefined,
          currency:      data.currency,
          avatar:        avatarBase64 ?? user?.profile?.avatar ?? undefined,
        },
      });
      setAvatarBase64(null);
      showSuccess(t("common.saved", "Պահպանվեց"));
    } catch (error: any) {
      showError(error?.message || t("profile.saveError", "Չհաջողվեց պահպանել"));
    }
  };

  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero-left">
          <div className="profile-avatar-box">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                className="profile-avatar-image"
              />
            ) : (
              <div className="profile-avatar-fallback">{avatarLetter}</div>
            )}
            <button
              type="button"
              className="profile-avatar-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              title={t("profile.changeAvatar", "Փոխել նկարը")}
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-hidden-file-input"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <span className="profile-badge">👤 {t("profile.title", "Պրոֆիլ")}</span>
            <h2 className="profile-title">{user.name || t("profile.title", "Պրոֆիլ")}</h2>
            <p className="profile-subtitle">{user.email || user.phone || t("profile.noEmail", "Email չկա")}</p>
          </div>
        </div>

        <div className="profile-hero-info">
          <div className="profile-info-pill">
            <span>{t("profile.currency", "Արժույթ")}</span>
            <strong>{user?.profile?.currency || "AMD"}</strong>
          </div>
          <div className="profile-info-pill">
            <span>{t("profile.role", "Դեր")}</span>
            <strong>{user?.role || "user"}</strong>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-card-header">
            <h3>{t("profile.personalInfo", "Անձնական տվյալներ")}</h3>
            <span>{t("profile.viewAndEdit", "Դիտել և խմբագրել")}</span>
          </div>

          <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="profile-form-row">
              <div className="profile-form-group">
                <label>{t("profile.name", "Անուն")}</label>
                <input
                  className="profile-input"
                  placeholder={t("profile.namePlaceholder", "Ձեր անունը")}
                  {...register("name", { required: true })}
                />
                {errors.name && (
                  <span className="profile-error">{t("profile.nameRequired", "Պարտադիր դաշտ")}</span>
                )}
              </div>

              <div className="profile-form-group">
                <label>{t("profile.age", "Տարիք")}</label>
                <input
                  className="profile-input"
                  type="number"
                  min="0"
                  placeholder={t("profile.agePlaceholder", "30")}
                  {...register("age")}
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label>{t("profile.maritalStatus", "Ամուսնական կարգ")}</label>
                <input
                  className="profile-input"
                  placeholder={t("profile.maritalStatusPlaceholder", "Ամուրի / Ամուսնացած")}
                  {...register("maritalStatus")}
                />
              </div>

              <div className="profile-form-group">
                <label>{t("profile.currency", "Հիմնական արժույթ")}</label>
                <select className="profile-input" {...register("currency")}>
                  <option value="AMD">AMD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="profile-actions">
              <button className="profile-save-btn" type="submit" disabled={isSubmitting}>
                💾 {t("profile.save", "Պահպանել")}
              </button>
            </div>
          </form>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <h3>{t("profile.changePassword", "Փոխել գաղտնաբառը")}</h3>
            <span>🔒</span>
          </div>
          <form className="profile-form" onSubmit={handleSubmitPwd(onChangePassword)}>
            <div className="profile-form-group">
              <label>{t("profile.currentPassword", "Ընթացիկ գաղտնաբառ")}</label>
              <input
                className="profile-input"
                type="password"
                placeholder="••••••••"
                {...registerPwd("currentPassword", { required: true })}
              />
              {pwdErrors.currentPassword && (
                <span className="profile-error">{t("auth.required", "Պարտադիր դաշտ")}</span>
              )}
            </div>
            <div className="profile-form-row">
              <div className="profile-form-group">
                <label>{t("profile.newPassword", "Նոր գաղտնաբառ")}</label>
                <input
                  className="profile-input"
                  type="password"
                  placeholder="••••••••"
                  {...registerPwd("newPassword", { required: true, minLength: 6 })}
                />
                {pwdErrors.newPassword && (
                  <span className="profile-error">{t("auth.minPassword", "Առնվազն 6 նիշ")}</span>
                )}
              </div>
              <div className="profile-form-group">
                <label>{t("auth.confirmPassword", "Հաստատել գաղտնաբառը")}</label>
                <input
                  className="profile-input"
                  type="password"
                  placeholder="••••••••"
                  {...registerPwd("confirmPassword", { required: true })}
                />
                {pwdErrors.confirmPassword && (
                  <span className="profile-error">{t("auth.required", "Պարտադիր դաշտ")}</span>
                )}
              </div>
            </div>
            <div className="profile-actions">
              <button className="profile-save-btn" type="submit" disabled={pwdSubmitting}>
                🔒 {t("profile.changePassword", "Փոխել գաղտնաբառը")}
              </button>
            </div>
          </form>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <h3>{t("profile.accountOverview", "Հաշվի ամփոփ")}</h3>
            <span>{t("profile.privateDataOnly", "Միայն ձեր տվյալները")}</span>
          </div>

          <div className="profile-overview-list">
            <div className="profile-overview-item">
              <span>{t("profile.name", "Անուն")}</span>
              <strong>{user.name || "—"}</strong>
            </div>
            <div className="profile-overview-item">
              <span>{t("profile.email", "Email")}</span>
              <strong>{user.email || "—"}</strong>
            </div>
            <div className="profile-overview-item">
              <span>{t("profile.phone", "Հեռ.")}</span>
              <strong>{user.phone || "—"}</strong>
            </div>
            <div className="profile-overview-item">
              <span>{t("profile.age", "Տարիք")}</span>
              <strong>{user?.profile?.age != null ? String(user.profile.age) : "—"}</strong>
            </div>
            <div className="profile-overview-item">
              <span>{t("profile.maritalStatus", "Ամուսնական կարգ")}</span>
              <strong>{user?.profile?.maritalStatus || "—"}</strong>
            </div>
            <div className="profile-overview-item">
              <span>{t("profile.currency", "Արժույթ")}</span>
              <strong>{user?.profile?.currency || "AMD"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
