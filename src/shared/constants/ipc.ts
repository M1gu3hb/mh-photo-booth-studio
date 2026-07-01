/**
 * Canonical IPC channel names. Both the main-process handlers and the preload
 * bridge import these constants so a channel can never be misspelled on one side.
 *
 * Naming convention: `<area>:<method>`.
 */
export const IPC_CHANNELS = {
  app: {
    getInfo: 'app:getInfo',
    setFullscreen: 'app:setFullscreen'
  },
  settings: {
    get: 'settings:get',
    update: 'settings:update'
  },
  storage: {
    getDataRoot: 'storage:getDataRoot',
    pickDataRoot: 'storage:pickDataRoot',
    setDataRoot: 'storage:setDataRoot'
  },
  db: {
    status: 'db:status'
  },
  events: {
    create: 'events:create',
    update: 'events:update',
    archive: 'events:archive',
    list: 'events:list',
    getActive: 'events:getActive',
    setActive: 'events:setActive',
    markReady: 'events:markReady',
    isReady: 'events:isReady'
  },
  templates: {
    create: 'templates:create',
    list: 'templates:list',
    get: 'templates:get',
    getImage: 'templates:getImage',
    save: 'templates:save',
    validate: 'templates:validate',
    duplicate: 'templates:duplicate',
    delete: 'templates:delete',
    export: 'templates:export',
    import: 'templates:import'
  },
  printTemplates: {
    list: 'printTemplates:list',
    get: 'printTemplates:get',
    create: 'printTemplates:create',
    save: 'printTemplates:save',
    delete: 'printTemplates:delete'
  },
  sessions: {
    start: 'sessions:start',
    savePhoto: 'sessions:savePhoto',
    complete: 'sessions:complete',
    saveComposition: 'sessions:saveComposition',
    discard: 'sessions:discard',
    listForEvent: 'sessions:listForEvent',
    getThumbnail: 'sessions:getThumbnail',
    getFinal: 'sessions:getFinal'
  },
  camera: {
    getConfig: 'camera:getConfig',
    setConfig: 'camera:setConfig'
  },
  qr: {
    validate: 'qr:validate',
    ensureForEvent: 'qr:ensureForEvent'
  },
  print: {
    listPrinters: 'print:listPrinters',
    test: 'print:test',
    print: 'print:print',
    retry: 'print:retry',
    listJobs: 'print:listJobs'
  },
  history: {
    archive: 'history:archive',
    openFinal: 'history:openFinal',
    openOriginals: 'history:openOriginals',
    exportSession: 'history:exportSession'
  },
  diagnostics: {
    run: 'diagnostics:run',
    export: 'diagnostics:export'
  },
  branding: {
    get: 'branding:get',
    set: 'branding:set',
    pickLogo: 'branding:pickLogo',
    getLogo: 'branding:getLogo',
    clearLogo: 'branding:clearLogo'
  },
  license: {
    status: 'license:status'
  },
  backup: {
    exportEvent: 'backup:exportEvent',
    importEvent: 'backup:importEvent'
  },
  web: {
    getConfig: 'web:getConfig',
    setConfig: 'web:setConfig',
    testConnection: 'web:testConnection',
    ensureEventFolio: 'web:ensureEventFolio',
    publishSessionFinal: 'web:publishSessionFinal',
    publishVideo: 'web:publishVideo',
    listUploads: 'web:listUploads',
    retryPending: 'web:retryPending',
    openPage: 'web:openPage'
  },
  videos: {
    saveRecorded: 'videos:saveRecorded',
    importVideo: 'videos:importVideo',
    list: 'videos:list',
    delete: 'videos:delete',
    getDataUrl: 'videos:getDataUrl'
  },
  videoTemplates: {
    list: 'videoTemplates:list',
    get: 'videoTemplates:get',
    create: 'videoTemplates:create',
    save: 'videoTemplates:save',
    delete: 'videoTemplates:delete'
  },
  display: {
    openPublic: 'display:openPublic',
    closePublic: 'display:closePublic',
    isPublicOpen: 'display:isPublicOpen'
  },
  live: {
    publishState: 'live:publishState',
    sendCommand: 'live:sendCommand',
    /** Push channels (main → renderers via webContents.send). */
    stateChannel: 'live:state',
    commandChannel: 'live:command'
  }
} as const;

export type IpcArea = keyof typeof IPC_CHANNELS;
