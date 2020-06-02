import React, { Component, ComponentClass, createRef} from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { Divider } from '../../../components/controls/divider/divider';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Switch } from '../../../components/controls/switch/switch';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Header } from '../../../components/controls/typography/typography';
import { I18nContext } from '../../../components/i18n/i18n-context';
import { localized } from '../../../components/i18n/localized';
import { ModelState } from '../../../components/store/model-state';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { AsyncDispatch } from '../../../utils/actions/actions';
import { notEmpty } from '../../../utils/not-empty';
import { ClassElementType } from '../../uml-class-diagram';
import { UMLClassAttribute } from '../../uml-class-diagram/uml-class-attribute/uml-class-attribute';
import { UMLClassMethod } from '../../uml-class-diagram/uml-class-method/uml-class-method';
import { UMLElementType } from '../../uml-element-type';
import { UMLElements } from '../../uml-elements';
import { UMLClassifier } from './uml-classifier';

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

interface OwnProps {
  element: UMLClassifier;
}

type StateProps = {};

interface DispatchProps {
  create: typeof UMLElementRepository.create;
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
  getById: (id: string) => UMLElement | null;
}

type Props = OwnProps & StateProps & DispatchProps & I18nContext;

const enhance = compose<ComponentClass<OwnProps>>(
  localized,
  connect<StateProps, DispatchProps, OwnProps, ModelState>(null, {
    create: UMLElementRepository.create,
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    getById: (UMLElementRepository.getById as any) as AsyncDispatch<typeof UMLElementRepository.getById>,
  }),
);

type State = {
  fieldToFocus?: Textfield | null;
};

const getInitialState = (): State => ({
  fieldToFocus: undefined,
});

class ClassifierUpdate extends Component<Props, State> {
  state = getInitialState();
  newMethodField = createRef<Textfield>();
  newAttributeField = createRef<Textfield>();
  attributeRefs: (Textfield | null)[] = [];
  methodRefs: (Textfield | null)[] = [];

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any) {
    if (this.state.fieldToFocus) {
      this.state.fieldToFocus.focus();
      this.setState({ fieldToFocus: undefined });
    }
  }

  render() {
    const { element, getById } = this.props;
    const children = element.ownedElements.map((id) => getById(id)).filter(notEmpty);
    const attributes = children.filter((child) => child instanceof UMLClassAttribute);
    const methods = children.filter((child) => child instanceof UMLClassMethod);

    return (
      <div>
        <section>
          <Flex>
            <Textfield value={element.name} onChange={this.rename(element.id)} autoFocus />
            <Button color="link" tabIndex={-1} onClick={this.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
          <Divider />
        </section>
        <section>
          <Switch value={element.type as keyof typeof ClassElementType} onChange={this.toggle} color="primary">
            <Switch.Item value={ClassElementType.AbstractClass}>
              {this.props.translate('packages.ClassDiagram.AbstractClass')}
            </Switch.Item>
            <Switch.Item value={ClassElementType.Interface}>
              {this.props.translate('packages.ClassDiagram.Interface')}
            </Switch.Item>
            <Switch.Item value={ClassElementType.Enumeration}>
              {this.props.translate('packages.ClassDiagram.Enumeration')}
            </Switch.Item>
          </Switch>
          <Divider />
        </section>
        <section>
          <Header>{this.props.translate('popup.attributes')}</Header>
          {attributes.map((attribute, index) => (
            <Flex key={attribute.id}>
              <Textfield
                ref={(ref) => (this.attributeRefs[index] = ref)}
                gutter={true}
                value={attribute.name}
                onChange={this.rename(attribute.id)}
                onSubmit={(value) =>
                  index === attributes.length - 1
                    ? this.newAttributeField.current?.focus()
                    : this.setState({
                        fieldToFocus: this.attributeRefs[index + 1],
                      })
                }
              />
              <Button color="link" tabIndex={-1} onClick={this.delete(attribute.id)}>
                <TrashIcon />
              </Button>
            </Flex>
          ))}
          <Textfield ref={this.newAttributeField} outline={true} value="" onSubmit={this.create(UMLClassAttribute)} />
        </section>
        <section>
          <Divider />
          <Header>{this.props.translate('popup.methods')}</Header>
          {methods.map((method, index) => (
            <Flex key={method.id}>
              <Textfield
                ref={(ref) => (this.methodRefs[index] = ref)}
                gutter={true}
                value={method.name}
                onChange={this.rename(method.id)}
                onSubmit={(value) =>
                  index === methods.length - 1
                    ? this.newMethodField.current?.focus()
                    : this.setState({
                        fieldToFocus: this.methodRefs[index + 1],
                      })
                }
              />
              <Button color="link" tabIndex={-1} onClick={this.delete(method.id)}>
                <TrashIcon />
              </Button>
            </Flex>
          ))}
          <Textfield
            ref={this.newMethodField}
            outline={true}
            value=""
            onSubmit={this.create(UMLClassMethod)}
            onKeyDown={(event) => {
              // workaround when 'tab' key is pressed:
              // prevent default and execute blur manually without switching to next tab index
              //then set focus to method field again (componentDidUpdate)
              if (event.keyCode == 9) {
                event.preventDefault();
                (event.target as HTMLElement).blur();
              }
            }}
          />
        </section>
      </div>
    );
  }

  private create = (Clazz: typeof UMLClassAttribute | typeof UMLClassMethod) => (value: string) => {
    const { element, create } = this.props;
    const member = new Clazz();
    member.name = value;
    create(member, element.id);
    if (member.type === ClassElementType.ClassAttribute) {
      this.setState({
        fieldToFocus: this.newAttributeField.current,
      });
    } else if (member.type === ClassElementType.ClassMethod) {
      this.setState({
        fieldToFocus: this.newMethodField.current,
      });
    }
  };

  private rename = (id: string) => (value: string) => {
    this.props.update(id, { name: value });
  };

  private toggle = (type: keyof typeof ClassElementType) => {
    const { element, update } = this.props;
    const newType: UMLElementType = element.type === type ? ClassElementType.Class : type;
    const instance = new UMLElements[newType]({
      id: element.id,
      name: element.name,
      type: element.type,
      owner: element.owner,
      bounds: element.bounds,
      ownedElements: element.ownedElements,
    });
    update(element.id, instance);
  };

  private delete = (id: string) => () => {
    this.props.delete(id);
  };
}

export const UMLClassifierUpdate = enhance(ClassifierUpdate);
