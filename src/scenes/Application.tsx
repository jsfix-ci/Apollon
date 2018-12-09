import React, { createRef, RefObject } from 'react';
import Store, { State as ReduxState } from './../components/Store';
import Theme, { Styles } from './../components/Theme';
import SelectionListener from './../components/SelectionListener/SelectionListener';
import CanvasContainer from './../components/Canvas/Container';
import Sidebar from './../components/Sidebar';
import { Layout } from './styles';

import DragDrop from './../components/DragDrop';
import Editor from './../components/Container';
import KeyboardEventListener from './../gui/events/KeyboardEventListener';
import { ApollonMode, ElementSelection } from '../domain/Options/types';

class App extends React.Component<Props, State> {
  store: RefObject<Store> = createRef();

  keyboardEventListener: KeyboardEventListener | null = null;

  state: State = {
    subscribers: [],
    selection: {
      entityIds: [],
      relationshipIds: [],
    },
  };

  constructor(props: Props) {
    super(props);

    this.state.subscribers = [this.subscribe];
  }

  componentDidMount() {
    this.keyboardEventListener =
      this.store.current &&
      this.props.state.options.mode !== ApollonMode.ReadOnly
        ? new KeyboardEventListener(this.store.current.store)
        : null;

    if (this.keyboardEventListener !== null) {
      this.keyboardEventListener.startListening();
    }
  }

  componentWillUnmount() {
    if (this.keyboardEventListener !== null) {
      this.keyboardEventListener.stopListening();
    }
  }

  subscribe = (selection: ElementSelection) => {
    this.keyboardEventListener &&
      this.keyboardEventListener.setSelection(selection);
    this.setState({ selection });
  };

  render() {
    return (
      <Store ref={this.store} initialState={this.props.state}>
        <Theme theme={this.props.theme}>
          <SelectionListener subscribers={this.state.subscribers}>
            <DragDrop>
              <Layout>
                <Editor><CanvasContainer /></Editor>
                <Sidebar />
              </Layout>
            </DragDrop>
          </SelectionListener>
        </Theme>
      </Store>
    );
  }
}

interface Props {
  state: ReduxState;
  theme: Partial<Styles>;
}

interface State {
  subscribers: Array<(selection: ElementSelection) => void>;
  selection: ElementSelection;
}

export default App;
