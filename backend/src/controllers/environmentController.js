import * as environmentService from '../services/environmentService.js'

export async function listHandler(req, res, next) {
  try {
    const environments = await environmentService.listEnvironments(req.user.id)
    res.json({ success: true, environments })
  } catch (error) {
    next(error)
  }
}

export async function createHandler(req, res, next) {
  try {
    const environment = await environmentService.createEnvironment(req.user.id, req.body)
    res.status(201).json({ success: true, environment })
  } catch (error) {
    next(error)
  }
}

export async function updateHandler(req, res, next) {
  try {
    const environment = await environmentService.updateEnvironment(
      req.user.id,
      req.params.environmentId,
      req.body
    )
    res.json({ success: true, environment })
  } catch (error) {
    next(error)
  }
}

export async function deleteHandler(req, res, next) {
  try {
    await environmentService.deleteEnvironment(req.user.id, req.params.environmentId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function listVariablesHandler(req, res, next) {
  try {
    const variables = await environmentService.listVariables(
      req.user.id,
      req.params.environmentId
    )
    res.json({ success: true, variables })
  } catch (error) {
    next(error)
  }
}

export async function upsertVariableHandler(req, res, next) {
  try {
    const variable = await environmentService.upsertVariable(
      req.user.id,
      req.params.environmentId,
      req.body
    )
    res.json({ success: true, variable })
  } catch (error) {
    next(error)
  }
}

export async function deleteVariableHandler(req, res, next) {
  try {
    await environmentService.deleteVariable(
      req.user.id,
      req.params.environmentId,
      req.params.variableId
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function resolvedMapHandler(req, res, next) {
  try {
    const variables = await environmentService.getResolvedVariables(
      req.user.id,
      req.params.environmentId
    )
    const masked = Object.fromEntries(
      Object.entries(variables).map(([k, v]) => [
        k,
        k.toLowerCase().includes('password') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('token')
          ? '••••••••'
          : v
      ])
    )
    res.json({ success: true, variables: masked, keys: Object.keys(variables) })
  } catch (error) {
    next(error)
  }
}
