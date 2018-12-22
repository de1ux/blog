import { Card, CardContent } from '@material-ui/core';
import * as React from 'react';

export const withFooter = <P extends object>(Component: React.ComponentType<P>) => {
    class footerHOC extends React.Component<P> {
        render() {
            return <div>
                <Component {...this.props} />
                <Card>
                    <CardContent style={{textAlign: 'center'}}>
                        Send me <a href='mailto:evans.nathan.j@gmail.com'>an email</a> to get notified of new posts!
                    </CardContent>
                </Card>
            </div>;
        }
    }

    return footerHOC;
};
