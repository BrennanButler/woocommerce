/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { useContext, useState } from '@wordpress/element';
import { getNewPath, navigateTo, useQuery } from '@woocommerce/navigation';
import { Button } from '@wordpress/components';
import classnames from 'classnames';
import { addQueryArgs } from '@wordpress/url';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './products.scss';
import { MarketplaceContext } from '../../contexts/marketplace-context';
import CategorySelector from '../category-selector/category-selector';
import ProductListContent from '../product-list-content/product-list-content';
import ProductLoader from '../product-loader/product-loader';
import NoResults from '../product-list-content/no-results';
import { Product, ProductType, SearchResultType } from '../product-list/types';
import { MARKETPLACE_ITEMS_PER_PAGE } from '../constants';
import { ADMIN_URL } from '~/utils/admin-settings';
import { ThemeSwitchWarningModal } from '~/customize-store/intro/warning-modals';

interface ProductsProps {
	categorySelector?: boolean;
	products?: Product[];
	perPage?: number;
	type: ProductType;
	searchTerm?: string;
	showAllButton?: boolean;
}

const LABELS = {
	[ ProductType.extension ]: {
		label: __( 'extensions', 'woocommerce' ),
		singularLabel: __( 'extension', 'woocommerce' ),
	},
	[ ProductType.theme ]: {
		label: __( 'themes', 'woocommerce' ),
		singularLabel: __( 'theme', 'woocommerce' ),
	},
};

export default function Products( props: ProductsProps ) {
	const marketplaceContextValue = useContext( MarketplaceContext );
	const { isLoading } = marketplaceContextValue;
	const label = LABELS[ props.type ].label;
	const singularLabel = LABELS[ props.type ].singularLabel;
	const query = useQuery();
	const category = query?.category;
	const perPage = props.perPage ?? MARKETPLACE_ITEMS_PER_PAGE;
	interface Theme {
		stylesheet?: string;
	}

	const currentTheme = useSelect( ( select ) => {
		return select( 'core' ).getCurrentTheme() as Theme;
	}, [] );
	const isDefaultTheme = currentTheme?.stylesheet === 'twentytwentyfour';
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const customizeStoreDesignUrl = addQueryArgs( `${ ADMIN_URL }admin.php`, {
		page: 'wc-admin',
		path: '/customize-store/design',
	} );

	// Only show the "View all" button when on search but not showing a specific section of results.
	const showAllButton = props.showAllButton ?? false;

	function showSection( section: ProductType ) {
		navigateTo( {
			url: getNewPath( { section } ),
		} );
	}

	// Store the total number of products before we slice it later.
	const productTotalCount = props.products?.length ?? 0;
	const products = props.products?.slice( 0, perPage ) ?? [];

	let title = sprintf(
		// translators: %s: plural item type (e.g. extensions, themes)
		__( '0 %s found', 'woocommerce' ),
		label
	);

	if ( productTotalCount > 0 ) {
		title = sprintf(
			// translators: %1$s: number of items, %2$s: singular item label, %3$s: plural item label
			_n( '%1$s %2$s', '%1$s %3$s', productTotalCount, 'woocommerce' ),
			productTotalCount,
			singularLabel,
			label
		);
	}

	const baseContainerClass = 'woocommerce-marketplace__search-';
	const baseProductListTitleClass = 'product-list-title--';

	const containerClassName = classnames( baseContainerClass + label );
	const productListTitleClassName = classnames(
		'woocommerce-marketplace__product-list-title',
		baseContainerClass + baseProductListTitleClass + label,
		{ 'is-loading': isLoading }
	);
	const viewAllButonClassName = classnames(
		'woocommerce-marketplace__view-all-button',
		baseContainerClass + 'button-' + label
	);

	if ( products.length === 0 ) {
		const type =
			props.type === ProductType.extension
				? SearchResultType.extension
				: SearchResultType.theme;

		return <NoResults type={ type } showHeading={ false } />;
	}

	const productListClass = classnames(
		showAllButton
			? 'woocommerce-marketplace__product-list-content--collapsed'
			: ''
	);

	if ( isLoading ) {
		return (
			<>
				{ props.categorySelector && (
					<CategorySelector type={ props.type } />
				) }
				<ProductLoader hasTitle={ false } type={ props.type } />
			</>
		);
	}

	return (
		<div className={ containerClassName }>
			<h2 className={ productListTitleClassName }>
				{ isLoading ? ' ' : title }
			</h2>
			<div className="woocommerce-marketplace__sub-header">
				{ props.categorySelector && (
					<CategorySelector type={ props.type } />
				) }
				{ props.type === 'theme' && (
					<Button
						className="woocommerce-marketplace__customize-your-store-button"
						variant="secondary"
						text={ __( 'Design your own', 'woocommerce' ) }
						onClick={ () => {
							if ( ! isDefaultTheme ) {
								setIsModalOpen( true );
							} else {
								window.location.href = customizeStoreDesignUrl;
							}
						} }
					/>
				) }
			</div>
			{ isModalOpen && (
				<ThemeSwitchWarningModal
					setIsModalOpen={ setIsModalOpen }
					redirectToCYSFlow={ () => {
						window.location.href = customizeStoreDesignUrl;
					} }
				/>
			) }
			<ProductListContent
				products={ products }
				type={ props.type }
				className={ productListClass }
				searchTerm={ props.searchTerm }
				category={ category }
			/>
			{ showAllButton && (
				<Button
					className={ viewAllButonClassName }
					variant="secondary"
					text={ __( 'View all', 'woocommerce' ) }
					onClick={ () => showSection( props.type ) }
				/>
			) }
		</div>
	);
}
