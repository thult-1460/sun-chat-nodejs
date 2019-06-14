import React from 'react';
import { UserContext } from './UserContext';

export function withUserContext(Component) {
  return function WrapperComponent(props) {
    return <UserContext.Consumer>{state => <Component {...props} userContext={state} />}</UserContext.Consumer>;
  };
}
