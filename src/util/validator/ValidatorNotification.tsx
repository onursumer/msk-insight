// This component is from Genome Nexus Frontend originally

import * as React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { EXAMPLE_DATA_GRCH37 } from '../Constants';

interface IValidatorNotificationProps {
    showAlert: boolean;
    type: ErrorType;
    onClose: () => void;
}

export enum ErrorType {
    INVALID = 'invalid format',
    NO_RESULT = 'no result',
}

class ValidatorNotification extends React.Component<
    IValidatorNotificationProps
> {
    public render() {
        if (this.props.type === ErrorType.INVALID) {
            return (
                <Modal
                    show={this.props.showAlert}
                    onHide={this.props.onClose}
                    centered={true}
                >
                    <Modal.Header closeButton={true}>
                        <Modal.Title>
                            The variant you entered is invalid
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.props.children}
                        <table className={'table validator-notification'}
                                style={{borderTop:"hidden"}}>
                            <tbody>
                                {EXAMPLE_DATA_GRCH37.map(example => {
                                    return (
                                        <tr key={`tr-${example.value}`}>
                                            <td>{example.label}</td>
                                            <td style={{width:"80px"}}>
                                                <a
                                                    href={`/variant/${example.value}`}
                                                    className={
                                                        'btn btn-primary btn-sm'
                                                    }
                                                    role={'button'}
                                                >
                                                    Try it
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div
                            className={'small'}
                            style={{ paddingLeft: '12px' }}
                        >
                            Currently only DNA changes in&nbsp;
                            <a
                                href="https://varnomen.hgvs.org/recommendations/DNA/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                HGVS
                            </a>
                            &nbsp;format are supported.
                            <br />
                            Other formats will be supported soon.
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={this.props.onClose}
                        >
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            );
        } else {
            return (
                <Modal
                    show={this.props.showAlert}
                    onHide={this.props.onClose}
                    centered={true}
                >
                    <Modal.Header closeButton={true}>
                        <Modal.Title>No result</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Please try another variant.</Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={this.props.onClose}
                        >
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            );
        }
    }
}

export default ValidatorNotification;
