import {
  listFolderTree,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../services/scenarioFolderService.js'

export async function listFoldersHandler(req, res, next) {
  try {
    const data = await listFolderTree(req.user.id)
    res.json({ success: true, ...data })
  } catch (error) {
    next(error)
  }
}

export async function createFolderHandler(req, res, next) {
  try {
    const { name, parentId } = req.body
    const folder = await createFolder(req.user.id, { name, parentId })
    res.status(201).json({ success: true, folder })
  } catch (error) {
    next(error)
  }
}

export async function updateFolderHandler(req, res, next) {
  try {
    const { id } = req.params
    const { name, parentId, sortOrder } = req.body
    const folder = await updateFolder(id, req.user.id, { name, parentId, sortOrder })
    res.json({ success: true, folder })
  } catch (error) {
    next(error)
  }
}

export async function deleteFolderHandler(req, res, next) {
  try {
    const { id } = req.params
    const result = await deleteFolder(id, req.user.id)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}
