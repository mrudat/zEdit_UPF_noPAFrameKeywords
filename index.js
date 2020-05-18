/* eslint-env node */
/* global xelib, registerPatcher, patcherUrl, info */

const {
  EditorID,
  ElementMatches,
  GetElement,
  GetRecordFlag,
  HasElement,
  HasKeyword,
  LongName,
  RemoveKeyword
} = xelib

const kywdPrefix = 'usePowerArmorFrame'

registerPatcher({
  info: info,
  gameModes: [xelib.gmFO4],
  settings: {
    label: info.name,
    templateUrl: `${patcherUrl}/partials/settings.html`,
    defaultSettings: {
      patchFileName: 'zPatch.esp'
    }
  },
  requiredFiles: ['Fallout4.esm'],
  execute: (patchFile, helpers, settings, locals) => ({
    initialize: function (patchFile, helpers, settings, locals) {
      const fallout4Esm = GetElement(0, 'Fallout4.esm')

      locals.ArmorTypePower = LongName(GetElement(fallout4Esm, 'KYWD\\ArmorTypePower'))
      locals.HumanRace = LongName(GetElement(fallout4Esm, 'RACE\\HumanRace'))

      const forbiddenKeywords = locals.forbiddenKeywords = new Set()

      for (const keyword of helpers.loadRecords('KYWD', false)) {
        const name = EditorID(keyword)
        if (name.startsWith(kywdPrefix)) {
          forbiddenKeywords.add(LongName(keyword))
        }
      }
    },
    process: [
      {
        load: {
          signature: 'ARMO',
          filter: function (armor) {
            if (GetRecordFlag(armor, 'Non-Playable')) return false
            if (!HasElement(armor, 'FULL')) return false
            if (!HasElement(armor, 'RNAM')) return false
            if (!ElementMatches(armor, 'RNAM', locals.HumanRace)) return false
            if (!HasElement(armor, 'KWDA')) return false
            if (HasKeyword(armor, locals.ArmorTypePower)) return false

            for (const keyword of locals.forbiddenKeywords) {
              if (HasKeyword(armor, keyword)) return true
            }

            return false
          }
        },
        patch: function (armor, helpers, settings, locals) {
          helpers.logMessage(`Processing ${LongName(armor)}`)

          for (const keyword of locals.forbiddenKeywords) {
            RemoveKeyword(armor, keyword)
          }
        }
      }
    ]
  })
})
