import { Router } from "express";
import { requireSession } from "../../common/middleware/sessionMiddleware";
import { validateRequest } from "../../common/middleware/validateRequest";
import { vaultItemController } from "./vaultItem.controller";
import {
  createVaultItemSchema,
  updateVaultItemSchema,
  vaultItemIdParamSchema,
} from "./vaultItem.validation";

const router = Router();

/** All vault-item routes require an active session. */
router.use(requireSession);

/** GET /api/v1/credentials — list all vault items for the session's vault. */
router.get("/", vaultItemController.list);

/** POST /api/v1/credentials — create a new vault item. */
router.post(
  "/",
  validateRequest({ body: createVaultItemSchema }),
  vaultItemController.create
);

/** GET /api/v1/credentials/:id — fetch a single vault item. */
router.get(
  "/:id",
  validateRequest({ params: vaultItemIdParamSchema }),
  vaultItemController.getById
);

/** PUT /api/v1/credentials/:id — update ciphertext (optimistic concurrency). */
router.put(
  "/:id",
  validateRequest({ params: vaultItemIdParamSchema, body: updateVaultItemSchema }),
  vaultItemController.update
);

/** DELETE /api/v1/credentials/:id — permanently remove a vault item. */
router.delete(
  "/:id",
  validateRequest({ params: vaultItemIdParamSchema }),
  vaultItemController.remove
);

export default router;
