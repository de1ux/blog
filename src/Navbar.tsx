import { Card, CardHeader, Grid } from '@material-ui/core';
import * as React from 'react';
import { Link } from 'react-router-dom';

export const withNavbar = <P extends object>(Component: React.ComponentType<P>) => {
    class navbarHOC extends React.Component<P> {
        render() {
            return <div>
                <Grid container alignItems={'center'} justify={'center'} spacing={24}>
                    <Grid item xs={12}>
                        <Link style={{textDecoration: 'none'}} to={'/'}>
                        <Card>
                            <CardHeader style={{fontFamily: 'Montserrat', textAlign: 'center'}} title={'de1ux'} subheader={'Learning how to blog in 2018'}/>
                        </Card>
                        </Link>
                    </Grid>
                    <Grid zeroMinWidth>
                        <Component {...this.props} />
                    </Grid>
                </Grid>
            </div>;
        }
    }

    return navbarHOC;
};
