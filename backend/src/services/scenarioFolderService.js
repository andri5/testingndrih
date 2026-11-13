import { prisma } from '../lib/prisma.js'

export const MAX_FOLDER_DEPTH = 5

async function assertFolderOwned(folderId, userId) {
  const folder = await prisma.scenarioFolder.findUnique({ where: { id: folderId } })
  if (!folder) throw new Error('Folder not found')
  if (folder.userId !== userId) throw new Error('Unauthorized: Cannot access this folder')
  return folder
}

async function getAncestorChain(folderId, userId) {
  const chain = []
  let currentId = folderId
  const seen = new Set()
  while (currentId) {
    if (seen.has(currentId)) throw new Error('Folder cycle detected')
    seen.add(currentId)
    const folder = await prisma.scenarioFolder.findFirst({
      where: { id: currentId, userId },
      select: { id: true, parentId: true, name: true },
    })
    if (!folder) break
    chain.push(folder)
    currentId = folder.parentId
  }
  return chain
}

async function getDepth(folderId, userId) {
  if (!folderId) return 0
  const chain = await getAncestorChain(folderId, userId)
  return chain.length
}

async function collectDescendantIds(folderId, userId) {
  const all = await prisma.scenarioFolder.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  })
  const byParent = new Map()
  for (const f of all) {
    const key = f.parentId || '__root__'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(f.id)
  }
  const result = []
  const walk = (id) => {
    const kids = byParent.get(id) || []
    for (const kid of kids) {
      result.push(kid)
      walk(kid)
    }
  }
  walk(folderId)
  return result
}

function buildTree(folders, countsByFolder) {
  const byParent = new Map()
  for (const f of folders) {
    const key = f.parentId || '__root__'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(f)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  }

  const mapNode = (folder) => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    sortOrder: folder.sortOrder,
    count: countsByFolder.get(folder.id) || 0,
    children: (byParent.get(folder.id) || []).map(mapNode),
  })

  return (byParent.get('__root__') || []).map(mapNode)
}

export async function listFolderTree(userId) {
  const folders = await prisma.scenarioFolder.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  const grouped = await prisma.scenario.groupBy({
    by: ['folderId'],
    where: { userId },
    _count: { _all: true },
  })
  const countsByFolder = new Map()
  let unfiled = 0
  let all = 0
  for (const row of grouped) {
    all += row._count._all
    if (row.folderId == null) unfiled += row._count._all
    else countsByFolder.set(row.folderId, row._count._all)
  }

  // Recursive counts (include descendants)
  const recursiveCounts = new Map()
  const addRecursive = (node) => {
    let total = node.count
    for (const child of node.children) {
      total += addRecursive(child)
    }
    recursiveCounts.set(node.id, total)
    node.countRecursive = total
    return total
  }

  const tree = buildTree(folders, countsByFolder)
  for (const node of tree) addRecursive(node)

  return {
    tree,
    counts: {
      all,
      unfiled,
      byFolder: Object.fromEntries(countsByFolder),
      byFolderRecursive: Object.fromEntries(recursiveCounts),
    },
  }
}

export async function createFolder(userId, { name, parentId = null }) {
  const trimmed = String(name || '').trim()
  if (!trimmed) throw new Error('Folder name is required')
  if (trimmed.length > 120) throw new Error('Folder name is too long')

  if (parentId) {
    await assertFolderOwned(parentId, userId)
    const depth = await getDepth(parentId, userId)
    if (depth >= MAX_FOLDER_DEPTH) {
      throw new Error(`Maximum folder depth is ${MAX_FOLDER_DEPTH}`)
    }
  }

  const siblings = await prisma.scenarioFolder.count({
    where: { userId, parentId: parentId || null },
  })

  return prisma.scenarioFolder.create({
    data: {
      name: trimmed,
      parentId: parentId || null,
      userId,
      sortOrder: siblings,
    },
  })
}

export async function updateFolder(folderId, userId, data) {
  await assertFolderOwned(folderId, userId)
  const patch = {}

  if (data.name !== undefined) {
    const trimmed = String(data.name || '').trim()
    if (!trimmed) throw new Error('Folder name is required')
    if (trimmed.length > 120) throw new Error('Folder name is too long')
    patch.name = trimmed
  }

  if (data.sortOrder !== undefined) {
    patch.sortOrder = Number(data.sortOrder) || 0
  }

  if (data.parentId !== undefined) {
    const nextParentId = data.parentId || null
    if (nextParentId === folderId) throw new Error('Folder cannot be its own parent')
    if (nextParentId) {
      await assertFolderOwned(nextParentId, userId)
      const descendants = await collectDescendantIds(folderId, userId)
      if (descendants.includes(nextParentId)) {
        throw new Error('Cannot move folder into its descendant')
      }
      const parentDepth = await getDepth(nextParentId, userId)
      const subtreeDepth = await maxSubtreeDepth(folderId, userId)
      if (parentDepth + subtreeDepth > MAX_FOLDER_DEPTH) {
        throw new Error(`Maximum folder depth is ${MAX_FOLDER_DEPTH}`)
      }
    }
    patch.parentId = nextParentId
  }

  return prisma.scenarioFolder.update({
    where: { id: folderId },
    data: patch,
  })
}

async function maxSubtreeDepth(folderId, userId) {
  const all = await prisma.scenarioFolder.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  })
  const byParent = new Map()
  for (const f of all) {
    const key = f.parentId || '__root__'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(f.id)
  }
  const depthOf = (id) => {
    const kids = byParent.get(id) || []
    if (!kids.length) return 1
    return 1 + Math.max(...kids.map(depthOf))
  }
  return depthOf(folderId)
}

export async function deleteFolder(folderId, userId) {
  await assertFolderOwned(folderId, userId)
  const descendantIds = await collectDescendantIds(folderId, userId)
  const allIds = [folderId, ...descendantIds]

  await prisma.$transaction([
    prisma.scenario.updateMany({
      where: { userId, folderId: { in: allIds } },
      data: { folderId: null },
    }),
    prisma.scenarioFolder.delete({ where: { id: folderId } }),
  ])

  return { message: 'Folder deleted successfully', unfiledScenarioFolders: allIds.length }
}

export async function assertFolderBelongsToUser(folderId, userId) {
  if (!folderId) return null
  return assertFolderOwned(folderId, userId)
}

export { collectDescendantIds }
