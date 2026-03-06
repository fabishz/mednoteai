const SOFT_DELETE_MODELS = new Set(['Patient', 'MedicalNote', 'VoiceNote']);
const SOFT_DELETE_ACTIONS = new Set(['findMany', 'findFirst', 'count', 'updateMany', 'deleteMany']);

function mergeWhereWithNotDeleted(where) {
  if (!where) {
    return { deletedAt: null };
  }

  return { AND: [where, { deletedAt: null }] };
}

export function ignoreSoftDeleted() {
  return async (params, next) => {
    if (!params.model || !SOFT_DELETE_MODELS.has(params.model)) {
      return next(params);
    }

    params.args ??= {};
    const includeDeleted = params.args.__includeDeleted === true;
    delete params.args.__includeDeleted;

    if (!includeDeleted && SOFT_DELETE_ACTIONS.has(params.action)) {
      params.args.where = mergeWhereWithNotDeleted(params.args.where);
    }

    return next(params);
  };
}
