/**
 * Builds a Gmail “compose” URL with a pre-filled question about advertising metrics.
 */

import { KPI_DEFS } from '../config/kpiConfig.js'
import { questionEmailTo, questionEmailSubject } from '../config/env.js'
import { formatDelta } from './kpiUtils.js'

/**
 * @param {object} opts
 * @param {string} opts.platformLabel
 * @param {string} opts.currentPeriodLabel
 * @param {string} opts.previousPeriodLabel
 * @param {Record<string, number|null>} opts.currentPeriodTotals
 * @param {Record<string, number|null>} opts.previousPeriodTotals
 * @param {Record<string, { value: number|null, direction: string }>} opts.deltas
 */
/** @returns {boolean} */
export function canBuildQuestionEmail() {
  return Boolean(questionEmailTo && questionEmailSubject)
}

export function buildAdvertisingQuestionGmailUrl(opts) {
  if (!canBuildQuestionEmail()) return ''

  const {
    platformLabel,
    currentPeriodLabel,
    previousPeriodLabel,
    currentPeriodTotals,
    previousPeriodTotals,
    deltas,
  } = opts

  const lines = []
  lines.push('Your Question:')
  lines.push('')
  lines.push('')
  lines.push(`Platform: ${platformLabel}`)
  lines.push(`This period: ${currentPeriodLabel}`)
  lines.push(`Previous period (comparison): ${previousPeriodLabel}`)
  lines.push('')
  lines.push('================================================================')
  lines.push('  KPI SUMMARY — this period vs previous')
  lines.push('================================================================')
  lines.push('')

  for (const def of KPI_DEFS) {
    const cur = currentPeriodTotals[def.key]
    const prev = previousPeriodTotals[def.key]
    const d = deltas[def.key]
    lines.push(`* ${def.label}`)
    lines.push(`    This period:       ${def.format(cur)}`)
    lines.push(`    Previous period:   ${def.format(prev)}`)
    lines.push(`    Change vs prior:   ${formatDelta(d)}`)
    lines.push('')
  }

  lines.push('----------------------------------------------------------------')

  const body = lines.join('\n')
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: questionEmailTo,
    su: questionEmailSubject,
    body,
  })
  return `https://mail.google.com/mail/?${params.toString()}`
}
