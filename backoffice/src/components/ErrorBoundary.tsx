import { Component } from 'react'
import type { ReactNode } from 'react'
import { withTranslation } from 'react-i18next'
import type { WithTranslation } from 'react-i18next'
import Button from './Button'
import ErrorPanel from './ErrorPanel'

type ErrorBoundaryProps = { children: ReactNode } & WithTranslation
type ErrorBoundaryState = { failed: boolean }

class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  render() {
    const { t, children } = this.props
    if (!this.state.failed) return children
    return (
      <ErrorPanel
        title={t('errors.crash.title')}
        message={t('errors.crash.message')}
        actions={
          <Button variant="primary" onClick={() => window.location.reload()}>
            {t('errors.reload')}
          </Button>
        }
      />
    )
  }
}

export default withTranslation()(ErrorBoundaryBase)
