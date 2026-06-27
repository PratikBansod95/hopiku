import type { PandaSkinId } from "@config/progression.constants";
import { PANDA_SKINS, getSkinUnlockDescription } from "@config/progression.constants";
import { SKIN_ORDER, SKIN_VISUALS } from "@config/skin.config";
import type { RuntimeState } from "@core/GameContext";
import { applyUiSprites } from "@services/AssetService";
import {
  equipSkin,
  getEquippedSkinId,
  isSkinUnlocked,
} from "@services/ProgressionService";
import { getSkinPreviewUrl } from "@services/SkinService";
import type { DomRefs } from "@ui/dom";
import { updateStartStats } from "@ui/dom";

export function renderSkinGrid(state: RuntimeState): void {
  const { skinGrid } = state.dom;
  const equipped = getEquippedSkinId();
  skinGrid.replaceChildren();

  for (const skinId of SKIN_ORDER) {
    const meta = PANDA_SKINS[skinId];
    const visual = SKIN_VISUALS[skinId];
    const unlocked = isSkinUnlocked(skinId);
    const isEquipped = equipped === skinId;
    const sprites = state.images.skins[skinId];

    const card = document.createElement("button");
    card.type = "button";
    card.className = "skin-card";
    card.dataset.skinId = skinId;
    card.disabled = !unlocked;
    card.setAttribute("aria-label", `${meta.name}${unlocked ? "" : " (locked)"}`);
    card.classList.toggle("is-equipped", isEquipped);
    card.classList.toggle("is-locked", !unlocked);

    const preview = document.createElement("img");
    preview.className = "skin-preview";
    preview.alt = "";
    preview.decoding = "async";
    preview.src = getSkinPreviewUrl(sprites);
    preview.draggable = false;

    const badge = document.createElement("span");
    badge.className = "skin-badge";
    badge.textContent = visual.badgeEmoji;

    const name = document.createElement("span");
    name.className = "skin-name";
    name.textContent = meta.name;

    const status = document.createElement("span");
    status.className = "skin-status";
    if (isEquipped) {
      status.textContent = "Equipped";
    } else if (unlocked) {
      status.textContent = "Tap to equip";
    } else {
      status.textContent = getSkinUnlockDescription(skinId);
    }

    if (!unlocked) {
      const lock = document.createElement("span");
      lock.className = "skin-lock";
      lock.textContent = "🔒";
      card.append(lock, preview, badge, name, status);
    } else {
      card.append(preview, badge, name, status);
    }

    skinGrid.append(card);
  }
}

export function openWardrobe(state: RuntimeState): void {
  state.wardrobeOpen = true;
  renderSkinGrid(state);
  state.dom.wardrobeScreen.classList.remove("hidden");
}

export function closeWardrobe(state: RuntimeState): void {
  state.wardrobeOpen = false;
  state.dom.wardrobeScreen.classList.add("hidden");
}

export function refreshWardrobeIfOpen(state: RuntimeState): void {
  if (state.wardrobeOpen) {
    renderSkinGrid(state);
  }
}

function tryEquipSkin(state: RuntimeState, skinId: PandaSkinId, onSkinChange: () => void): void {
  if (!isSkinUnlocked(skinId)) return;
  state.feedback.tap();
  if (!equipSkin(skinId)) return;

  state.equippedSkinId = skinId;
  onSkinChange();
  renderSkinGrid(state);
  updateStartStats(state.dom);
}

export function bindWardrobe(
  dom: DomRefs,
  state: RuntimeState,
  onSkinChange: () => void,
): void {
  dom.btnWardrobe.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    openWardrobe(state);
  });

  dom.btnWardrobeClose.addEventListener("click", (event) => {
    event.stopPropagation();
    closeWardrobe(state);
  });

  dom.skinGrid.addEventListener("click", (event) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const card = target.closest<HTMLButtonElement>(".skin-card");
    if (!card?.dataset.skinId) return;
    tryEquipSkin(state, card.dataset.skinId as PandaSkinId, onSkinChange);
  });

  dom.wardrobeScreen.addEventListener("click", (event) => {
    if (event.target === dom.wardrobeScreen) {
      event.stopPropagation();
      closeWardrobe(state);
    }
  });
}

export function syncEquippedSkinUi(state: RuntimeState): void {
  applyUiSprites(state.images, state.equippedSkinId);
  updateStartStats(state.dom);
  refreshWardrobeIfOpen(state);
}
